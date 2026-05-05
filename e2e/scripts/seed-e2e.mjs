import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const E2E_EMAIL = 'e2e@taskflow.test';
const E2E_MEMBER_EMAIL = 'e2e-member@testflow.test';
const E2E_PASSWORD = 'TestPassword123!';

const prisma = new PrismaClient();

async function resetE2eData() {
  const emails = [E2E_EMAIL, E2E_MEMBER_EMAIL];

  await prisma.organization.deleteMany({
    where: { slug: 'e2e-test-org' },
  });

  await prisma.user.deleteMany({
    where: { email: { in: emails } },
  });
}

async function seedE2eUser() {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 12);

  const owner = await prisma.user.create({
    data: {
      email: E2E_EMAIL,
      password: passwordHash,
      name: 'E2E Owner',
      plan: 'PRO',
      onboardingCompletedAt: new Date(),
    },
  });

  const member = await prisma.user.create({
    data: {
      email: E2E_MEMBER_EMAIL,
      password: passwordHash,
      name: 'E2E Member',
      onboardingCompletedAt: new Date(),
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: 'E2E Test Org',
      slug: 'e2e-test-org',
      ownerId: owner.id,
      plan: 'PRO',
      stripeSubscriptionId: 'e2e_pro_subscription',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'E2E Kanban Project',
      description: 'Seeded project for Playwright tests',
      color: '#3b82f6',
      organizationId: organization.id,
    },
  });

  const taskSeeds = [
    { title: 'E2E Todo One', status: 'TODO', position: 0, priority: 'MEDIUM' },
    { title: 'E2E Todo Two', status: 'TODO', position: 1, priority: 'LOW' },
    { title: 'E2E In Progress', status: 'IN_PROGRESS', position: 0, priority: 'HIGH' },
    { title: 'E2E Review Task', status: 'REVIEW', position: 0, priority: 'MEDIUM' },
    { title: 'E2E Done Task', status: 'DONE', position: 0, priority: 'LOW' },
    { title: 'Fix login bug', status: 'TODO', position: 2, priority: 'URGENT', assigneeId: member.id },
  ];

  for (const task of taskSeeds) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project.id,
      },
    });
  }

  return {
    ownerId: owner.id,
    memberId: member.id,
    organizationId: organization.id,
    projectId: project.id,
  };
}

async function main() {
  console.log('Resetting and seeding E2E data…');
  await resetE2eData();
  const ids = await seedE2eUser();
  console.log('E2E seed complete:', ids);
}

main()
  .catch((error) => {
    console.error('E2E seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
