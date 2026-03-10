import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { assertCanCreateProject } from './planService.js';
import {
  requireOrgAdmin,
  requireOrgMembership,
} from './organizationService.js';

const PROJECT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#22c55e',
  '#14b8a6',
  '#eab308',
  '#ef4444',
];

function formatProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    organizationId: project.organizationId,
    color: project.color,
    taskCount: project._count?.tasks ?? 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function listProjects(userId, { organizationId } = {}) {
  if (!organizationId) {
    throw new AppError('organizationId query parameter is required', 400);
  }

  await requireOrgMembership(userId, organizationId);

  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return projects.map(formatProject);
}

export async function getProjectById(userId, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { tasks: true } } },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  await requireOrgMembership(userId, project.organizationId);

  return formatProject(project);
}

export async function createProject(userId, { name, description, organizationId, color }) {
  const membership = await requireOrgMembership(userId, organizationId);

  if (membership.role === 'MEMBER') {
    throw new AppError('Insufficient permissions to create projects', 403);
  }

  await assertCanCreateProject(membership.organization);

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      organizationId,
      color: color || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    },
    include: { _count: { select: { tasks: true } } },
  });

  return formatProject(project);
}

export async function updateProject(userId, projectId, data) {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });

  if (!existing) {
    throw new AppError('Project not found', 404);
  }

  await requireOrgAdmin(userId, existing.organizationId);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && {
        description: data.description?.trim() || null,
      }),
      ...(data.color !== undefined && { color: data.color }),
    },
    include: { _count: { select: { tasks: true } } },
  });

  return formatProject(project);
}

export async function deleteProject(userId, projectId) {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });

  if (!existing) {
    throw new AppError('Project not found', 404);
  }

  await requireOrgAdmin(userId, existing.organizationId);

  await prisma.project.delete({ where: { id: projectId } });

  return { message: 'Project deleted successfully' };
}

export { PROJECT_COLORS };
