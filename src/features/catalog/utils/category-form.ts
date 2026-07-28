export function sanitizeCategorySlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCategorySubmitPayload(input: {
  name: string;
  slug: string;
  position: number;
  editingCategory?: any | null;
}) {
  const name = input.name.trim();
  const position = Number(input.position) || 1;
  const existingSlug = sanitizeCategorySlug(input.editingCategory?.slug || "");
  const calculatedSlug = sanitizeCategorySlug(
    input.slug.trim() || existingSlug || name,
  );
  const payload: {
    name: string;
    slug?: string;
    position: number;
  } = { name, position };

  if (!input.editingCategory || calculatedSlug !== existingSlug) {
    payload.slug = calculatedSlug;
  }

  return { payload, calculatedSlug };
}
