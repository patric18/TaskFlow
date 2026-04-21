import { prisma } from '../../config/database.js';

export async function resetDatabase() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.taskLabel.deleteMany(),
    prisma.task.deleteMany(),
    prisma.label.deleteMany(),
    prisma.project.deleteMany(),
    prisma.organizationMember.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.stripeWebhookEvent.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
