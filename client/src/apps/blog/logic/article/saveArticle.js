import { slugify }         from "./slugify.js";
import { validateArticle } from "./validation.js";

/**
 * Build the article payload, validate, and persist via crud.save().
 *
 * @param {object} engine
 * @param {object} crud        – createCrudStore instance
 * @param {object} inputs      – { titleNode, excerptNode, contentNode, photoNode, statusNode }
 * @param {object|null} currentUser
 * @returns {{ saved: boolean }}
 */
export async function saveArticle(engine, crud, inputs, currentUser = null) {
  if (crud.state.isSaving.value) return { saved: false };

  const title           = inputs.titleNode.value.trim();
  const excerpt         = inputs.excerptNode.value.trim();
  const content         = inputs.contentNode.value.trim();
  const photo           = inputs.photoNode.value.trim();
  const requestedStatus = inputs.statusNode.value.trim().toLowerCase();

  const { valid, error } = validateArticle({ title });
  if (!valid) {
    engine.systemUI.toastLayer.show(error);
    return { saved: false };
  }

  const status = requestedStatus === "published" ? "published" : "draft";
  const now    = Date.now();
  const slug   = slugify(title) || `article-${now}`;
  const actor  = currentUser?.username ?? "system";

  await crud.save({
    articleId:   slug,
    title,
    content,
    excerpt:     excerpt || title,
    photo,
    slug,
    status,
    createdAt:   now,
    publishedAt: status === "published" ? now : 0,
    updatedAt:   now,
    createdBy:   actor,
    updatedBy:   actor,
  });

  return { saved: !crud.state.error.value };
}
