/**
 * Convert a title string into a URL-safe slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
