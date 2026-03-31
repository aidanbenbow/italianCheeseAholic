import { createBannerNode }       from "../components/common/banner.js";
import { createArticleListItem }  from "../components/article/articleListItem.js";

/**
 * createListPage
 * Builds the article-list page node and returns a stable API for
 * updating the article rows reactively.
 *
 * @param {object} engine
 * @param {{ onNavigateToCreate: () => void, listBannerText: SignalImpl }} options
 * @returns {{ pageNode: SceneNode, renderArticles: (articles: object[]) => void }}
 */
export function createListPage(engine, { onNavigateToCreate, listBannerText }) {
  const pageNode = engine.ui.createScrollableNode({
    id:    "blog-list-page",
    style: { background: "#0F172A" },
  });

  const bannerNode = createBannerNode(engine, { id: "blog-list-banner" });

  const openCreateButton = engine.ui.createButtonNode({
    id:    "blog-open-create-page-button",
    label: "Create New Article",
    style: {
      font:        "13px sans-serif",
      textColor:   "#111827",
      background:  "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight:   36,
      paddingX:    16,
    },
    onPress: () => onNavigateToCreate(),
  });

  engine.ui.mountNode(bannerNode, pageNode);
  engine.ui.mountNode(openCreateButton, pageNode);
  engine.ui.bindText(bannerNode, listBannerText);

  let articleNodes = [];

  function renderArticles(articles) {
    for (const node of articleNodes) {
      engine.ui.unmountNode(node);
    }
    articleNodes = [];

    if (!articles.length) {
      const emptyNode = engine.ui.createTextNode({
        id:    "blog-empty-state",
        style: {
          width:       420,
          height:      36,
          background:  "#1F2937",
          color:       "#E5E7EB",
          font:        "12px sans-serif",
          paddingLeft: 12,
        },
      });
      emptyNode.text = "No articles yet. Tap 'Create New Article' to add one.";
      articleNodes.push(emptyNode);
      engine.ui.mountNode(emptyNode, pageNode);
      return;
    }

    for (let i = 0; i < articles.length; i++) {
      const node = createArticleListItem(engine, { article: articles[i], index: i });
      articleNodes.push(node);
      engine.ui.mountNode(node, pageNode);
    }
  }

  return { pageNode, renderArticles };
}
