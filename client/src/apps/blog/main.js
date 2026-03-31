export function mount(engine) {
  engine.context.debugFlags.logUiOnStart = true;

  const crud = engine.ui.createCrudStore({
    listUrl:     '/api/blog/articles',
    saveUrl:     '/api/blog/articles',
    itemsKey:    'articles',
    onSaved:      ()      => engine.systemUI.toastLayer.show("Article saved"),
    onSaveError:  (error) => { engine.systemUI.toastLayer.show("Save failed"); console.error("Blog article save failed", error); },
    onLoadError:  (error) => console.error("Blog articles fetch failed", error),
  });

  const bannerText = engine.ui.signal("New Article");
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
      color: "#ebe5e1",
      paddingLeft: 12
    }
  });

  const excerptInputNode = engine.ui.createInputNode({
    id: "blog-excerpt-input",
    placeholder: "Enter short excerpt",
    style: {
      width: 420,
      height: 40,
      background: "#7989ad",
      borderColor: "#374151",
      color: "#e37725",
      paddingLeft: 12
    }
  });

  const contentInputNode = engine.ui.createInputNode({
    id: "blog-content-input",
    placeholder: "Enter article content",
    style: {
      width: 420,
      height: 40,
      background: "#7989ad",
      borderColor: "#374151",
      color: "#e37725",
      paddingLeft: 12
    }
  });

  const photoInputNode = engine.ui.createInputNode({
    id: "blog-photo-input",
    placeholder: "Enter photo URL (optional)",
    style: {
      width: 420,
      height: 40,
      background: "#7989ad",
      borderColor: "#374151",
      color: "#e37725",
      paddingLeft: 12
    }
  });

  const statusInputNode = engine.ui.createInputNode({
    id: "blog-status-input",
    placeholder: "Status: draft or published",
    value: "draft",
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
    onPress: () => { onSaveArticle(); }
  });

  engine.ui.mountNode(bannerNode);
  engine.ui.mountNode(inputNode);
  engine.ui.mountNode(excerptInputNode);
  engine.ui.mountNode(contentInputNode);
  engine.ui.mountNode(photoInputNode);
  engine.ui.mountNode(statusInputNode);
  engine.ui.mountNode(saveButton);

  engine.ui.bindText(bannerNode, bannerText);

  engine.ui.effect(() => {
    const isLoading = crud.state.isLoading.value;
    const count = crud.state.articles.value.length;
    const hasError = Boolean(crud.state.error.value);

    if (isLoading) {
      bannerText.value = "Loading articles...";
      return;
    }

    const syncLabel = hasError ? " (sync issue)" : "";
    bannerText.value = `Blog ready (${count} article${count === 1 ? "" : "s"})${syncLabel}`;
  });

  engine.ui.effect(() => {
    renderArticleTitles(crud.state.articles.value);
  });

  engine.commands.execute('debug:inputPipeline');

  crud.load();
  engine.systemUI.toastLayer.show("Welcome!");

  async function onSaveArticle() {
    if (crud.state.isSaving.value) {
      return;
    }

    const title = inputNode.value.trim();
    const excerpt = excerptInputNode.value.trim();
    const content = contentInputNode.value.trim();
    const photo = photoInputNode.value.trim();
    const requestedStatus = statusInputNode.value.trim().toLowerCase();

    if (!title) {
      engine.systemUI.toastLayer.show("Enter a title first");
      return;
    }

    const status = requestedStatus === "published" ? "published" : "draft";

    const now = Date.now();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const articlePayload = {
      articleId: slug || `article-${now}`,
      title,
      content,
      excerpt: excerpt || title,
      photo,
      slug: slug || `article-${now}`,
      status,
      createdAt: now,
      publishedAt: status === "published" ? now : 0,
      updatedAt: now,
      createdBy: "admin",
      updatedBy: "admin"
    };

    await crud.save(articlePayload);

    if (crud.state.error.value) {
      return;
    }

    inputNode.value = "";
    excerptInputNode.value = "";
    contentInputNode.value = "";
    photoInputNode.value = "";
    statusInputNode.value = "draft";
  }

  function renderArticleTitles(articles) {
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