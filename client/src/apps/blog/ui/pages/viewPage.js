import { createBannerNode } from "../components/common/banner.js";

/**
 * createViewPage
 * Displays a selected article in a dedicated view page.
 *
 * @param {object} engine
 * @param {{ onNavigateToList: () => void }} options
 * @returns {{ pageNode: SceneNode, setArticle: (article: object) => void }}
 */
export function createViewPage(engine, { onNavigateToList }) {
  const pageNode = engine.ui.createScrollableNode({
    id: "blog-view-page",
    style: { background: "#0F172A" },
  });

  const bannerNode = createBannerNode(engine, {
    id: "blog-view-banner",
    text: "Article View",
  });

  const backButton = engine.ui.createButtonNode({
    id: "blog-view-back-button",
    label: "← Back to Articles",
    style: {
      font: "13px sans-serif",
      textColor: "#111827",
      background: "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight: 36,
      paddingX: 16,
    },
    onPress: () => onNavigateToList(),
  });

  const titleNode = engine.ui.createTextNode({
    id: "blog-view-title",
    style: {
      width: 420,
      height: 36,
      background: "#1F2937",
      color: "#F3F4F6",
      font: "14px sans-serif",
      paddingLeft: 12,
    },
  });

  const excerptNode = engine.ui.createTextNode({
    id: "blog-view-excerpt",
    style: {
      width: 420,
      height: 36,
      background: "#111827",
      color: "#D1D5DB",
      font: "12px sans-serif",
      paddingLeft: 12,
    },
  });

  const statusNode = engine.ui.createTextNode({
    id: "blog-view-status",
    style: {
      width: 420,
      height: 32,
      background: "#111827",
      color: "#93C5FD",
      font: "12px sans-serif",
      paddingLeft: 12,
    },
  });

  const contentNode = engine.ui.createTextNode({
    id: "blog-view-content",
    style: {
      width: 420,
      minHeight: 120,
      background: "#111827",
      color: "#E5E7EB",
      font: "12px sans-serif",
      paddingLeft: 12,
      paddingTop: 8,
      wrap: true,
      lineGap: 2,
    },
  });

  engine.ui.mountNode(bannerNode, pageNode);
  engine.ui.mountNode(backButton, pageNode);
  engine.ui.mountNode(titleNode, pageNode);
  engine.ui.mountNode(excerptNode, pageNode);
  engine.ui.mountNode(statusNode, pageNode);
  engine.ui.mountNode(contentNode, pageNode);

  function setArticle(article = {}) {
    const title = article.title || article.name || article.articleId || "Untitled article";
    const excerpt = article.excerpt || "No excerpt";
    const status = article.status || "draft";
    const content = article.content || "No content";

    titleNode.text = `Title: ${title}`;
    excerptNode.text = `Excerpt: ${excerpt}`;
    statusNode.text = `Status: ${status}`;
    contentNode.text = `Content: ${content}`;
  }

  return { pageNode, setArticle };
}
