import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';
const DEMO_EMAILS = ['demo@taskflow.app', 'bob@taskflow.app', 'carol@taskflow.app'];

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function cleanupDemoData() {
  await prisma.organization.deleteMany({
    where: { slug: 'acme-team-demo' },
  });

  await prisma.user.deleteMany({
    where: { email: { in: DEMO_EMAILS } },
  });
}

async function main() {
  console.log('Seeding TaskFlow demo data…');

  await cleanupDemoData();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const owner = await prisma.user.create({
    data: {
      email: 'demo@taskflow.app',
      password: passwordHash,
      name: 'Demo Owner',
      plan: 'PRO',
      onboardingCompletedAt: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'bob@taskflow.app',
      password: passwordHash,
      name: 'Bob Admin',
      onboardingCompletedAt: new Date(),
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'carol@taskflow.app',
      password: passwordHash,
      name: 'Carol Member',
      onboardingCompletedAt: new Date(),
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Team',
      slug: 'acme-team-demo',
      ownerId: owner.id,
      plan: 'PRO',
      stripeSubscriptionId: 'seed_acme_pro_subscription',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.user.update({
    where: { id: owner.id },
    data: { plan: 'PRO' },
  });

  const websiteProject = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Refresh marketing site, landing pages, and blog templates.',
      color: '#3b82f6',
      organizationId: organization.id,
    },
  });

  const launchProject = await prisma.project.create({
    data: {
      name: 'Product Launch',
      description: 'Coordinate launch tasks across product, marketing, and support.',
      color: '#8b5cf6',
      organizationId: organization.id,
    },
  });

  const labelUrgent = await prisma.label.create({
    data: { name: 'Urgent', color: '#ef4444', projectId: websiteProject.id },
  });

  const labelDesign = await prisma.label.create({
    data: { name: 'Design', color: '#ec4899', projectId: websiteProject.id },
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Audit current homepage',
        description: '<p>Review analytics, heatmaps, and top exit pages.</p>',
        status: 'DONE',
        priority: 'HIGH',
        position: 0,
        projectId: websiteProject.id,
        assigneeId: member.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Wireframe new hero section',
        description: '<p>Mobile-first layout with updated value proposition.</p>',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        position: 0,
        projectId: websiteProject.id,
        assigneeId: admin.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Write launch announcement',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 0,
        projectId: launchProject.id,
        assigneeId: owner.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        title: 'Prepare support FAQ',
        status: 'REVIEW',
        priority: 'MEDIUM',
        position: 0,
        projectId: launchProject.id,
        assigneeId: member.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up analytics events',
        status: 'TODO',
        priority: 'LOW',
        position: 1,
        projectId: launchProject.id,
      },
    }),
  ]);

  const [auditTask, wireframeTask, announcementTask, faqTask] = tasks;

  await prisma.taskLabel.createMany({
    data: [
      { taskId: wireframeTask.id, labelId: labelDesign.id },
      { taskId: faqTask.id, labelId: labelUrgent.id },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        content: 'Homepage bounce rate is 62% — focus on above-the-fold clarity.',
        taskId: auditTask.id,
        authorId: admin.id,
      },
      {
        content: 'Draft wireframes are in Figma. Need feedback on CTA placement.',
        taskId: wireframeTask.id,
        authorId: admin.id,
      },
      {
        content: 'Can we align launch copy with the new pricing page?',
        taskId: announcementTask.id,
        authorId: member.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to "${auditTask.title}"`,
        metadata: { taskId: auditTask.id, projectId: websiteProject.id },
      },
      {
        userId: admin.id,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to "${wireframeTask.title}"`,
        metadata: { taskId: wireframeTask.id, projectId: websiteProject.id },
      },
      {
        userId: owner.id,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to "${announcementTask.title}"`,
        metadata: { taskId: announcementTask.id, projectId: launchProject.id },
        read: true,
      },
      {
        userId: member.id,
        type: 'MEMBER_INVITED',
        message: `You were added to ${organization.name}`,
        metadata: { organizationId: organization.id },
        read: true,
      },
      {
        userId: owner.id,
        type: 'PLAN_UPGRADED',
        message: 'Your workspace was upgraded to Pro',
        metadata: { organizationId: organization.id },
        read: true,
      },
    ],
  });

  console.log('');
  console.log('Demo data created successfully.');
  console.log('');
  console.log('Workspace: Acme Team (Pro plan)');
  console.log('Projects:  Website Redesign, Product Launch');
  console.log('');
  console.log('Login credentials (password for all: password123):');
  console.log('  demo@taskflow.app  — Owner');
  console.log('  bob@taskflow.app   — Admin');
  console.log('  carol@taskflow.app — Member');
  console.log('');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
