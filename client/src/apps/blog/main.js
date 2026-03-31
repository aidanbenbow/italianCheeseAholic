import { createBlogCrudStore }  from "./state/crudStore.js";
import { saveArticle }          from "./logic/article/saveArticle.js";
import { createPageSwitcher }   from "./ui/layout/pageSwitcher.js";
import { createListPage }       from "./ui/pages/listPage.js";
import { createCreatePage }     from "./ui/pages/createPage.js";
import { clearArticleInputs }   from "./ui/components/common/inputs.js";

export function mount(engine) {
  engine.context.debugFlags.logUiOnStart = true;

  // ── State ──────────────────────────────────────────────────────────────────
  const crud           = createBlogCrudStore(engine);
  const listBannerText = engine.ui.signal("Loading articles...");

  // ── Pages ──────────────────────────────────────────────────────────────────
  const pageSwitcher = createPageSwitcher(engine);

  const listPage = createListPage(engine, {
    onNavigateToCreate: () => pageSwitcher.show(createPage.pageNode),
    listBannerText,
  });

  const createPage = createCreatePage(engine, {
    onNavigateToList: () => pageSwitcher.show(listPage.pageNode),
    onSavePress:      () => handleSave(),
  });

  // ── Reactive banner text ───────────────────────────────────────────────────
  engine.ui.effect(() => {
    const isLoading = crud.state.isLoading.value;
    const count     = crud.state.articles.value.length;
    const hasError  = Boolean(crud.state.error.value);

    if (isLoading) {
      listBannerText.value = "Loading articles...";
      return;
    }

    const syncLabel      = hasError ? " (sync issue)" : "";
    listBannerText.value = `Blog articles (${count})${syncLabel}`;
  });

  // ── Reactive article list ──────────────────────────────────────────────────
  engine.ui.effect(() => {
    listPage.renderArticles(crud.state.articles.value);
  });

  // ── Boot ───────────────────────────────────────────────────────────────────
  engine.commands.execute('debug:inputPipeline');
  pageSwitcher.show(listPage.pageNode);
  crud.load();
  engine.systemUI.toastLayer.show("Welcome!");

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave() {
    const { saved } = await saveArticle(engine, crud, createPage.inputs);
    if (saved) {
      clearArticleInputs(createPage.inputs);
      pageSwitcher.show(listPage.pageNode);
    }
  }
}