import { getPlanLimits, assertCanCreateProject, assertCanAddMember } from '../../services/planService.js';
import { prisma } from '../../config/database.js';
import { resetDatabase } from '../helpers/testDb.js';
import { hashPassword } from '../../utils/password.js';

describe('planService', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns plan limits', () => {
    expect(getPlanLimits('FREE').projects).toBe(3);
    expect(getPlanLimits('PRO').projects).toBe(Infinity);
  });

  it('blocks project creation on free plan limit', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        password: await hashPassword('password123'),
        name: 'Owner',
      },
    });

    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        ownerId: owner.id,
        plan: 'FREE',
        members: { create: { userId: owner.id, role: 'OWNER' } },
      },
    });

    await prisma.project.createMany({
      data: Array.from({ length: 3 }, (_, index) => ({
        name: `Project ${index + 1}`,
        color: '#3b82f6',
        organizationId: org.id,
      })),
    });

    await expect(assertCanCreateProject(org)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('Project limit'),
    });
  });

  it('blocks member creation on free plan limit', async () => {
    const password = await hashPassword('password123');
    const owner = await prisma.user.create({
      data: { email: 'owner2@test.com', password, name: 'Owner' },
    });

    const org = await prisma.organization.create({
      data: {
        name: 'Team Org',
        slug: 'team-org',
        ownerId: owner.id,
        plan: 'FREE',
      },
    });

    const users = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        prisma.user.create({
          data: {
            email: `member${index}@test.com`,
            password,
            name: `Member ${index}`,
          },
        }),
      ),
    );

    await prisma.organizationMember.createMany({
      data: users.map((user, index) => ({
        userId: user.id,
        organizationId: org.id,
        role: index === 0 ? 'OWNER' : 'MEMBER',
      })),
    });

    await expect(assertCanAddMember(org)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('Member limit'),
    });
  });
});
