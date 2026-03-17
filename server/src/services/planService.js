export const PLAN_LIMITS = {
  FREE: {
    organizations: 1,
    projects: 3,
    members: 5,
    fileUploads: false,
  },
  PRO: {
    organizations: Infinity,
    projects: Infinity,
    members: Infinity,
    fileUploads: true,
  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

export async function assertCanCreateProject(organization) {
  const limits = getPlanLimits(organization.plan);

  if (limits.projects === Infinity) {
    return;
  }

  const { prisma } = await import('../config/database.js');
  const count = await prisma.project.count({
    where: { organizationId: organization.id },
  });

  if (count >= limits.projects) {
    const { AppError } = await import('../utils/errors.js');
    throw new AppError('Project limit reached. Upgrade to Pro for unlimited projects.', 403);
  }
}

export async function assertCanCreateOrganization(userId, userPlan) {
  const limits = getPlanLimits(userPlan);

  if (limits.organizations === Infinity) {
    return;
  }

  const { prisma } = await import('../config/database.js');
  const count = await prisma.organizationMember.count({
    where: { userId, role: 'OWNER' },
  });

  if (count >= limits.organizations) {
    const { AppError } = await import('../utils/errors.js');
    throw new AppError('Organization limit reached. Upgrade to Pro for unlimited organizations.', 403);
  }
}

export async function assertCanAddMember(organization) {
  const limits = getPlanLimits(organization.plan);

  if (limits.members === Infinity) {
    return;
  }

  const { prisma } = await import('../config/database.js');
  const count = await prisma.organizationMember.count({
    where: { organizationId: organization.id },
  });

  if (count >= limits.members) {
    const { AppError } = await import('../utils/errors.js');
    throw new AppError('Member limit reached. Upgrade to Pro for unlimited team members.', 403);
  }
}
