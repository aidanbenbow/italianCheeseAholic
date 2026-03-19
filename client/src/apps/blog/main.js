export function mount(engine) {
  const bannerText = engine.ui.signal("Blog booting...");
  let articles = [];

  const bannerNode = engine.ui.createTextNode({
    id: "blog-banner",
    style: {
      x: 20,
      y: 20,
      width: 260,
      height: 36,
      background: "#0F172A",
      color: "#b2abab",
      font: "14px sans-serif",
      paddingLeft: 50
    }
  });

  engine.ui.mountNode(bannerNode);
  engine.ui.bindText(bannerNode, bannerText);

  loadArticles();

  engine.systemUI.toastLayer.show("Welcome!");
  engine.systemUI.popupLayer.show("intro", "Get started");

  async function loadArticles() {
    try {
      const response = await fetch("/api/blog/articles");
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load articles");
      }

      articles = Array.isArray(payload.data) ? payload.data : [];
      const count = articles.length;
      bannerText.value = `Blog ready (${count} article${count === 1 ? "" : "s"})`;

      renderArticleTitles();
    } catch (error) {
      bannerText.value = "Blog ready (articles unavailable)";
      console.error("Blog articles fetch failed", error);
    }
  }

  function renderArticleTitles() {
    articles.forEach((article, index) => {
      const titleNode = engine.ui.createTextNode({
        id: `article-${index}`,
        style: {
          width: 260,
          height: 24,
          color: "#CCCCCC",
          font: "12px sans-serif",
          paddingLeft: 20,
          paddingTop: 4
        }
      });

      // Display article title, or fall back to articleId
      const title = article.title || article.name || article.articleId || `Article ${index + 1}`;
      titleNode.text = title;
      engine.ui.mountNode(titleNode);
    });
  }
}