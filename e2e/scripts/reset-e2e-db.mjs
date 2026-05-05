import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.organization.deleteMany({ where: { slug: 'e2e-test-org' } });
  await prisma.user.deleteMany({
    where: { email: { in: ['e2e@taskflow.test', 'e2e-member@testflow.test'] } },
  });
}

main()
  .catch((error) => {
    console.error('E2E reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
