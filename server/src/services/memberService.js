import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { sendMemberInviteEmail } from '../utils/email.js';
import { assertCanAddMember } from './planService.js';
import {
  getMembership,
  requireOrgAdmin,
  requireOrgMembership,
} from './organizationService.js';

export async function inviteOrganizationMember(actorId, organizationId, { email, role = 'MEMBER' }) {
  const actorMembership = await requireOrgAdmin(actorId, organizationId);
  const organization = actorMembership.organization;

  await assertCanAddMember(organization);

  if (role === 'ADMIN' && actorMembership.role !== 'OWNER') {
    throw new AppError('Only the owner can invite admins', 403);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new AppError(
      'No user found with this email. Ask them to register first, then invite again.',
      404,
    );
  }

  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId },
    },
  });

  if (existingMember) {
    throw new AppError('User is already a member of this organization', 409);
  }

  const inviter = await prisma.user.findUniqueOrThrow({ where: { id: actorId } });

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: 'MEMBER_INVITED',
        message: `You were added to ${organization.name}`,
        metadata: { organizationId },
      },
    });

    return created;
  });

  await sendMemberInviteEmail({
    to: user.email,
    inviterName: inviter.name,
    organizationName: organization.name,
    inviteUrl: `${env.CLIENT_URL}/dashboard`,
  });

  return {
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatar: member.user.avatar,
    role: member.role,
    joinedAt: member.createdAt,
  };
}

export async function updateOrganizationMemberRole(
  actorId,
  organizationId,
  targetUserId,
  { role },
) {
  const actorMembership = await requireOrgAdmin(actorId, organizationId);

  const targetMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId: targetUserId, organizationId },
    },
  });

  if (!targetMembership) {
    throw new AppError('Member not found', 404);
  }

  if (role === 'OWNER' && actorMembership.role !== 'OWNER') {
    throw new AppError('Only the owner can transfer ownership', 403);
  }

  if (targetMembership.role === 'OWNER' && role !== 'OWNER') {
    throw new AppError('Transfer ownership before changing the owner role', 403);
  }

  if (actorMembership.role === 'ADMIN') {
    if (targetMembership.role !== 'MEMBER' || role !== 'MEMBER') {
      throw new AppError('Insufficient permissions to change this role', 403);
    }
  }

  const updated = await prisma.organizationMember.update({
    where: { id: targetMembership.id },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  return {
    userId: updated.user.id,
    name: updated.user.name,
    email: updated.user.email,
    avatar: updated.user.avatar,
    role: updated.role,
    joinedAt: updated.createdAt,
  };
}

export async function removeOrganizationMember(actorId, organizationId, targetUserId) {
  const actorMembership = await requireOrgAdmin(actorId, organizationId);

  if (targetUserId === actorId) {
    throw new AppError('You cannot remove yourself. Transfer ownership first.', 403);
  }

  const targetMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId: targetUserId, organizationId },
    },
  });

  if (!targetMembership) {
    throw new AppError('Member not found', 404);
  }

  if (targetMembership.role === 'OWNER') {
    throw new AppError('Cannot remove the organization owner', 403);
  }

  if (targetMembership.role === 'ADMIN' && actorMembership.role !== 'OWNER') {
    throw new AppError('Only the owner can remove admins', 403);
  }

  await prisma.organizationMember.delete({ where: { id: targetMembership.id } });

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: 'MEMBER_REMOVED',
      message: `You were removed from the organization`,
      metadata: { organizationId },
    },
  });

  return { message: 'Member removed successfully' };
}

export async function updateOrganization(actorId, organizationId, { name }) {
  await requireOrgAdmin(actorId, organizationId);

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: { name: name.trim() },
  });

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    plan: organization.plan,
  };
}
