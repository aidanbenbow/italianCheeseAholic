/**
 * Validate article form values.
 * @param {{ title: string }} fields
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateArticle({ title }) {
  if (!title || !title.trim()) {
    return { valid: false, error: "Enter a title first" };
  }
  return { valid: true };
}
