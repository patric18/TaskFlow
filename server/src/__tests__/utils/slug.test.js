import { slugify, generateUniqueOrgSlug } from '../../utils/slug.js';

describe('slug utils', () => {
  it('slugifies text', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('  Acme   Team  ')).toBe('acme-team');
  });

  it('generates unique slugs when collisions exist', async () => {
    const taken = new Set(['acme-team']);

    const slug = await generateUniqueOrgSlug('Acme Team', async (candidate) => taken.has(candidate));

    expect(slug).toBe('acme-team-1');
  });
});
