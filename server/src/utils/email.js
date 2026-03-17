import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const resend =
  env.RESEND_API_KEY && !env.RESEND_API_KEY.startsWith('re_xxx')
    ? new Resend(env.RESEND_API_KEY)
    : null;

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = 'Reset your TaskFlow password';
  const html = `
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the link below to choose a new password:</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
  `;

  if (!resend) {
    logger.info({ to, resetUrl }, 'Password reset email (dev mode — Resend not configured)');
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.app>',
    to,
    subject,
    html,
  });
}

export async function sendMemberInviteEmail({ to, inviterName, organizationName, inviteUrl }) {
  const subject = `You've been invited to ${organizationName} on TaskFlow`;
  const html = `
    <p>Hi,</p>
    <p>${inviterName} invited you to join <strong>${organizationName}</strong> on TaskFlow.</p>
    <p><a href="${inviteUrl}">Accept invitation</a></p>
  `;

  if (!resend) {
    logger.info({ to, inviteUrl }, 'Member invite email (dev mode — Resend not configured)');
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.app>',
    to,
    subject,
    html,
  });
}
