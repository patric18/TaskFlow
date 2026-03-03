import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { generateUniqueOrgSlug } from '../utils/slug.js';

export async function createDefaultOrganization(userId, userName) {
  const slug = await generateUniqueOrgSlug(`${userName}-workspace`, async (candidate) => {
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: `${userName}'s Workspace`,
        slug,
        ownerId: userId,
      },
    });

    await tx.organizationMember.create({
      data: {
        userId,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    return organization;
  });
}

export async function getUserOrganizations(userId) {
  let memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: { select: { projects: true, members: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (memberships.length === 0) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await createDefaultOrganization(userId, user.name);

    memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: { select: { projects: true, members: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  return memberships.map(({ organization, role }) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    plan: organization.plan,
    role,
    projectCount: organization._count.projects,
    memberCount: organization._count.members,
    createdAt: organization.createdAt,
  }));
}

export async function getMembership(userId, organizationId) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    include: { organization: true },
  });

  if (!membership) {
    throw new AppError('You do not have access to this organization', 403);
  }

  return membership;
}

export async function requireOrgMembership(userId, organizationId) {
  return getMembership(userId, organizationId);
}

export async function requireOrgAdmin(userId, organizationId) {
  const membership = await getMembership(userId, organizationId);

  if (membership.role === 'MEMBER') {
    throw new AppError('Insufficient permissions', 403);
  }

  return membership;
}

export async function getOrganizationById(userId, organizationId) {
  const membership = await getMembership(userId, organizationId);

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    plan: membership.organization.plan,
    role: membership.role,
    createdAt: membership.organization.createdAt,
  };
}

export async function listOrganizationMembers(userId, organizationId) {
  await requireOrgMembership(userId, organizationId);

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return members.map((member) => ({
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatar: member.user.avatar,
    role: member.role,
    joinedAt: member.createdAt,
  }));
}
