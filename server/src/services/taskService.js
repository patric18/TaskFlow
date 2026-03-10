import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import {
  requireOrgAdmin,
  requireOrgMembership,
} from './organizationService.js';

function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
          avatar: task.assignee.avatar,
        }
      : null,
    dueDate: task.dueDate,
    position: task.position,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function getProjectWithAccess(userId, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  await requireOrgMembership(userId, project.organizationId);

  return project;
}

async function getTaskWithAccess(userId, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      project: true,
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await requireOrgMembership(userId, task.project.organizationId);

  return task;
}

export async function listTasks(userId, { projectId, status, assigneeId }) {
  await getProjectWithAccess(userId, projectId);

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(status && { status }),
      ...(assigneeId && { assigneeId }),
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
    orderBy: [{ status: 'asc' }, { position: 'asc' }],
  });

  return tasks.map(formatTask);
}

export async function getTaskById(userId, taskId) {
  const task = await getTaskWithAccess(userId, taskId);
  return formatTask(task);
}

async function getNextPosition(projectId, status) {
  const last = await prisma.task.findFirst({
    where: { projectId, status },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return last ? last.position + 1 : 0;
}

export async function createTask(userId, data) {
  const project = await getProjectWithAccess(userId, data.projectId);

  const membership = await requireOrgMembership(userId, project.organizationId);
  if (membership.role === 'MEMBER' && !data.assigneeId) {
    // Members can create tasks assigned to themselves; admins can create freely
  }

  if (data.assigneeId) {
    await requireOrgMembership(data.assigneeId, project.organizationId);
  }

  const status = data.status || 'TODO';
  const position = await getNextPosition(data.projectId, status);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        projectId: data.projectId,
        status,
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        position,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (data.assigneeId && data.assigneeId !== userId) {
      await tx.notification.create({
        data: {
          userId: data.assigneeId,
          type: 'TASK_ASSIGNED',
          message: `You were assigned to "${created.title}"`,
          metadata: { taskId: created.id, projectId: data.projectId },
        },
      });
    }

    return created;
  });

  return formatTask(task);
}

export async function updateTask(userId, taskId, data) {
  const existing = await getTaskWithAccess(userId, taskId);

  if (data.assigneeId) {
    await requireOrgMembership(data.assigneeId, existing.project.organizationId);
  }

  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (
      data.assigneeId &&
      data.assigneeId !== existing.assigneeId &&
      data.assigneeId !== userId
    ) {
      await tx.notification.create({
        data: {
          userId: data.assigneeId,
          type: 'TASK_ASSIGNED',
          message: `You were assigned to "${updated.title}"`,
          metadata: { taskId, projectId: existing.projectId },
        },
      });
    }

    return updated;
  });

  return formatTask(task);
}

export async function updateTaskPosition(userId, taskId, { status: newStatus, position: newPosition }) {
  const task = await getTaskWithAccess(userId, taskId);

  await prisma.$transaction(async (tx) => {
    if (task.status !== newStatus) {
      const oldColumnTasks = await tx.task.findMany({
        where: {
          projectId: task.projectId,
          status: task.status,
          id: { not: taskId },
        },
        orderBy: { position: 'asc' },
      });

      for (let i = 0; i < oldColumnTasks.length; i += 1) {
        await tx.task.update({
          where: { id: oldColumnTasks[i].id },
          data: { position: i },
        });
      }
    }

    let targetTasks = await tx.task.findMany({
      where: {
        projectId: task.projectId,
        status: newStatus,
        ...(task.status === newStatus ? {} : { id: { not: taskId } }),
      },
      orderBy: { position: 'asc' },
    });

    if (task.status === newStatus) {
      const currentIndex = targetTasks.findIndex((item) => item.id === taskId);
      const [removed] = targetTasks.splice(currentIndex, 1);
      const clampedPosition = Math.min(Math.max(0, newPosition), targetTasks.length);
      targetTasks.splice(clampedPosition, 0, removed);
    } else {
      const clampedPosition = Math.min(Math.max(0, newPosition), targetTasks.length);
      targetTasks.splice(clampedPosition, 0, task);
    }

    for (let i = 0; i < targetTasks.length; i += 1) {
      await tx.task.update({
        where: { id: targetTasks[i].id },
        data: { position: i, status: newStatus },
      });
    }
  });

  return getTaskById(userId, taskId);
}

export async function deleteTask(userId, taskId) {
  const task = await getTaskWithAccess(userId, taskId);

  await requireOrgAdmin(userId, task.project.organizationId);

  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id: taskId } });

    const remaining = await tx.task.findMany({
      where: { projectId: task.projectId, status: task.status },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remaining.length; i += 1) {
      await tx.task.update({
        where: { id: remaining[i].id },
        data: { position: i },
      });
    }
  });

  return { message: 'Task deleted successfully' };
}
