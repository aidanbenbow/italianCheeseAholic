export function mount(engine) {
  engine.context.debugFlags.logUiOnStart = true;
  const bannerText = engine.ui.signal("Blog booting...");
  let articles = [];
  let titleNodes = [];

  const bannerNode = engine.ui.createTextNode({
    id: "blog-banner",
    style: {
      width: 420,
      height: 36,
      background: "#767e91",
      color: "#b2abab",
      font: "14px sans-serif",
      paddingLeft: 16
    }
  });

  const inputNode = engine.ui.createInputNode({
    id: "blog-title-input",
    placeholder: "Enter article title",
    style: {
      width: 420,
      height: 40,
      background: "#7989ad",
      borderColor: "#374151",
      color: "#e37725",
      paddingLeft: 12
    }
  });

  const saveButton = engine.ui.createButtonNode({
    id: "blog-save-button",
    label: "Save Article",
    style: {
      font: "13px sans-serif",
      textColor: "#111827",
      background: "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight: 36,
      paddingX: 16
    },
    onPress: () => { saveArticle(); }
  });

  engine.ui.mountNode(bannerNode);
  engine.ui.mountNode(inputNode);
  engine.ui.mountNode(saveButton);

  engine.ui.bindText(bannerNode, bannerText);

  engine.commands.execute('debug:inputPipeline');

  loadArticles();
  engine.systemUI.toastLayer.show("Welcome!");

  async function saveArticle() {
    const title = inputNode.value.trim();
    if (!title) {
      engine.systemUI.toastLayer.show("Enter a title first");
      return;
    }

    try {
      const response = await fetch("/api/blog/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to save article");
      }

      inputNode.value = "";
      engine.systemUI.toastLayer.show("Article saved");
      await loadArticles();
    } catch (error) {
      engine.systemUI.toastLayer.show("Save failed");
      console.error("Blog article save failed", error);
    }
  }

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
    for (const node of titleNodes) {
      engine.ui.unmountNode(node);
    }
    titleNodes = [];

    articles.forEach((article, index) => {
      const title = article.title || article.name || article.articleId || `Article ${index + 1}`;
      const titleNode = engine.ui.createTextNode({
        id: `article-${index}`,
        text: title,
        style: {
          width: 420,
          height: 24,
          color: "#D1D5DB",
          font: "12px sans-serif",
          paddingLeft: 8
        }
      });

      titleNodes.push(titleNode);
      engine.ui.mountNode(titleNode);
    });
  }
}