export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateUniqueOrgSlug(baseName, checkExists) {
  let slug = slugify(baseName);
  let suffix = 0;

  while (await checkExists(slug)) {
    suffix += 1;
    slug = `${slugify(baseName)}-${suffix}`;
  }

  return slug;
}
