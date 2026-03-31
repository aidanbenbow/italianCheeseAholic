/**
 * createArticleListItem
 * Returns a single text row node for the article list.
 *
 * @param {object} engine
 * @param {{ article: object, index: number }} options
 * @returns SceneNode
 */
export function createArticleListItem(engine, { article, index }) {
  const title   = article.title || article.name || article.articleId || `Article ${index + 1}`;
  const excerpt = article.excerpt || "No excerpt";

  const node = engine.ui.createTextNode({
    id:    `blog-article-${index}`,
    style: {
      width:      420,
      height:     36,
      background: index % 2 === 0 ? "#1F2937" : "#111827",
      color:      "#F3F4F6",
      font:       "12px sans-serif",
      paddingLeft: 12,
    },
  });

  node.text = `${index + 1}. ${title} — ${excerpt}`;

  return node;
}
