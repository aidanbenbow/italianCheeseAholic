/**
 * createArticleListItem
 * Returns a single clickable row node for the article list.
 *
 * @param {object} engine
 * @param {{ article: object, index: number, onOpen: (article: object) => void }} options
 * @returns SceneNode
 */
export function createArticleListItem(engine, { article, index, onOpen }) {
  const title   = article.title || article.name || article.articleId || `Article ${index + 1}`;
  const excerpt = article.excerpt || "No excerpt";

  const node = engine.ui.createButtonNode({
    id:    `blog-article-${index}`,
    label: `${index + 1}. ${title} — ${excerpt}`,
    style: {
      width:      420,
      height:     36,
      background: index % 2 === 0 ? "#1F2937" : "#111827",
      hoverBackground: "#374151",
      pressedBackground: "#4B5563",
      textColor:      "#F3F4F6",
      font:       "12px sans-serif",
      paddingLeft: 12,
      borderColor: "#374151",
    },
    onPress: () => onOpen?.(article),
  });

  return node;
}
