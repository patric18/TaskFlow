import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { getTaskById } from './taskService.js';
import {
  requireOrgAdmin,
  requireOrgMembership,
} from './organizationService.js';

function formatComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    taskId: comment.taskId,
    authorId: comment.authorId,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      avatar: comment.author.avatar,
    },
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

export async function listComments(userId, taskId) {
  await getTaskById(userId, taskId);

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return comments.map(formatComment);
}

export async function createComment(userId, taskId, { content }) {
  const task = await getTaskById(userId, taskId);

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        content: content.trim(),
        taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await tx.notification.create({
        data: {
          userId: task.assigneeId,
          type: 'TASK_COMMENT',
          message: `New comment on "${task.title}"`,
          metadata: { taskId, commentId: created.id, projectId: task.projectId },
        },
      });
    }

    return created;
  });

  return formatComment(comment);
}

export async function deleteComment(userId, commentId) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      task: {
        include: { project: true },
      },
    },
  });

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  await requireOrgMembership(userId, comment.task.project.organizationId);

  if (comment.authorId !== userId) {
    await requireOrgAdmin(userId, comment.task.project.organizationId);
  }

  await prisma.comment.delete({ where: { id: commentId } });

  return { message: 'Comment deleted successfully' };
}
