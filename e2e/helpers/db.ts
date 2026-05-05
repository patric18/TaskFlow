import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const DEFAULT_E2E_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/taskflow_e2e';

function getDatabaseUrl() {
  return process.env.DATABASE_E2E_URL || DEFAULT_E2E_DATABASE_URL;
}

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: { db: { url: getDatabaseUrl() } },
    });
  }

  return prisma;
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function findUserByEmail(email: string) {
  return getPrisma().user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function verifyUserPassword(email: string, plainPassword: string) {
  const user = await findUserByEmail(email);
  if (!user?.password) return false;
  return bcrypt.compare(plainPassword, user.password);
}

export async function createPasswordResetToken(email: string, rawToken: string, expiresAt?: Date) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`User not found: ${email}`);

  await getPrisma().passwordResetToken.deleteMany({ where: { userId: user.id } });

  return getPrisma().passwordResetToken.create({
    data: {
      token: hashToken(rawToken),
      userId: user.id,
      expiresAt: expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    },
  });
}

export async function createExpiredPasswordResetToken(email: string, rawToken: string) {
  return createPasswordResetToken(email, rawToken, new Date(Date.now() - 2 * 60 * 60 * 1000));
}

export async function getOrganizationBySlug(slug: string) {
  return getPrisma().organization.findUnique({ where: { slug } });
}

export async function getTaskById(taskId: string) {
  return getPrisma().task.findUnique({ where: { id: taskId } });
}

export async function getCommentsForTask(taskId: string) {
  return getPrisma().comment.findMany({ where: { taskId } });
}

export async function deleteUserByEmail(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return;

  await getPrisma().organization.deleteMany({ where: { ownerId: user.id } });
  await getPrisma().user.delete({ where: { id: user.id } });
}

export async function setOrganizationPlan(organizationId: string, plan: 'FREE' | 'PRO') {
  return getPrisma().organization.update({
    where: { id: organizationId },
    data: { plan },
  });
}

export async function disconnectDb() {
  if (prisma) {
    await prisma.$disconnect();
  }
}
