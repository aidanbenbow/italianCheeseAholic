import { createBannerNode }       from "../components/common/banner.js";
import { createArticleListItem }  from "../components/article/articleListItem.js";

/**
 * createListPage
 * Builds the article-list page node and returns a stable API for
 * updating the article rows reactively.
 *
 * @param {object} engine
 * @param {{ onNavigateToCreate: () => void, onNavigateToLogin: () => void, onLogout: () => void, onOpenArticle: (article: object) => void }} options
 * @returns {{ pageNode: SceneNode, renderArticles: (articles: object[]) => void, setBannerText: (text: string) => void, setAuthState: (state: object) => void }}
 */
export function createListPage(engine, { onNavigateToCreate, onNavigateToLogin, onLogout, onOpenArticle }) {
  const pageNode = engine.ui.createScrollableNode({
    id:    "blog-list-page",
    style: { background: "#0F172A" },
  });

  const bannerNode = createBannerNode(engine, { id: "blog-list-banner" });

  engine.ui.mountNode(bannerNode, pageNode);

  let currentArticles = [];
  let articleNodes = [];
  let authNodes = [];

  function createActionButton(id, label, onPress) {
    return engine.ui.createButtonNode({
      id,
      label,
      style: {
        font: "13px sans-serif",
        textColor: "#111827",
        background: "#E5E7EB",
        borderColor: "#9CA3AF",
        minHeight: 36,
        paddingX: 16,
      },
      onPress,
    });
  }

  function createInfoNode(text, color = "#D1D5DB") {
    const node = engine.ui.createTextNode({
      id: `blog-auth-info-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      style: {
        width: 420,
        minHeight: 30,
        background: "#111827",
        color,
        font: "12px sans-serif",
        paddingLeft: 12,
        paddingTop: 8,
        wrap: true,
      },
    });
    node.text = text;
    return node;
  }

  function renderAuthState(authState = {}) {
    for (const node of authNodes) {
      engine.ui.unmountNode(node);
    }
    authNodes = [];

    if (authState.isAdmin) {
      const infoNode = createInfoNode(`Signed in as ${authState.user?.username ?? "admin"} (admin).`, "#86EFAC");
      const createButton = createActionButton("blog-open-create-page-button", "Create New Article", () => onNavigateToCreate());
      const logoutButton = createActionButton("blog-logout-button", "Sign Out", () => onLogout());
      authNodes.push(infoNode, createButton, logoutButton);
    } else {
      const infoNode = createInfoNode("Public visitors can read articles. Sign in as admin to create new ones.");
      const loginButton = createActionButton("blog-open-login-page-button", "Admin Login", () => onNavigateToLogin());
      authNodes.push(infoNode, loginButton);
    }

    for (const node of authNodes) {
      engine.ui.mountNode(node, pageNode);
    }

    renderArticles(currentArticles);
  }

  function renderArticles(articles) {
    currentArticles = Array.isArray(articles) ? articles : [];

    for (const node of articleNodes) {
      engine.ui.unmountNode(node);
    }
    articleNodes = [];

    if (!currentArticles.length) {
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

    for (let i = 0; i < currentArticles.length; i++) {
      const node = createArticleListItem(engine, {
        article: currentArticles[i],
        index: i,
        onOpen: onOpenArticle,
      });
      articleNodes.push(node);
      engine.ui.mountNode(node, pageNode);
    }
  }

  return {
    pageNode,
    renderArticles,
    setBannerText(text) {
      bannerNode.text = text;
    },
    setAuthState(authState) {
      renderAuthState(authState);
    },
  };
}
