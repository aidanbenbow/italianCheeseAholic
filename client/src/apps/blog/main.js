import { createBlogCrudStore }  from "./state/crudStore.js";
import { createBlogAuthStore }  from "./state/authStore.js";
import { saveArticle }          from "./logic/article/saveArticle.js";
import { createPageSwitcher }   from "./ui/layout/pageSwitcher.js";
import { createListPage }       from "./ui/pages/listPage.js";
import { createCreatePage }     from "./ui/pages/createPage.js";
import { createLoginPage }      from "./ui/pages/loginPage.js";
import { createViewPage }       from "./ui/pages/viewPage.js";
import { clearArticleInputs }   from "./ui/components/common/inputs.js";

export function mount(engine) {
  engine.context.debugFlags.logUiOnStart = true;

  // ── State ──────────────────────────────────────────────────────────────────
  const crud           = createBlogCrudStore(engine);
  const auth           = createBlogAuthStore(engine);

  // ── Pages ──────────────────────────────────────────────────────────────────
  const pageSwitcher = createPageSwitcher(engine);

  const listPage = createListPage(engine, {
    onNavigateToCreate: () => pageSwitcher.show(createPage.pageNode),
    onNavigateToLogin:  () => pageSwitcher.show(loginPage.pageNode),
    onLogout:           () => handleLogout(),
    onOpenArticle:      (article) => {
      viewPage.setArticle(article);
      pageSwitcher.show(viewPage.pageNode);
    },
  });

  const createPage = createCreatePage(engine, {
    onNavigateToList: () => pageSwitcher.show(listPage.pageNode),
    onSavePress:      () => handleSave(),
  });

  const loginPage = createLoginPage(engine, {
    onNavigateToList: () => pageSwitcher.show(listPage.pageNode),
    onLoginPress:     () => handleLogin(),
  });

  const viewPage = createViewPage(engine, {
    onNavigateToList: () => pageSwitcher.show(listPage.pageNode),
  });

  // ── Reactive banner text ───────────────────────────────────────────────────
  engine.ui.effect(() => {
    const isLoading = crud.state.isLoading.value;
    const count     = crud.state.articles.value.length;
    const hasError  = Boolean(crud.state.error.value);

    if (isLoading) {
      listPage.setBannerText("Loading articles...");
      return;
    }

    const syncLabel      = hasError ? " (sync issue)" : "";
    listPage.setBannerText(`Blog articles (${count})${syncLabel}`);
  });

  // ── Reactive article list ──────────────────────────────────────────────────
  engine.ui.effect(() => {
    listPage.renderArticles(crud.state.articles.value);
  });

  engine.ui.effect(() => {
    listPage.setAuthState({
      user: auth.state.user.value,
      isAuthenticated: auth.state.isAuthenticated.value,
      isAdmin: auth.state.isAdmin.value,
      isLoading: auth.state.isLoading.value,
      error: auth.state.error.value,
    });
  });

  // ── Boot ───────────────────────────────────────────────────────────────────
  engine.commands.execute('debug:inputPipeline');
  pageSwitcher.show(listPage.pageNode);
  auth.refresh();
  crud.load();
  engine.systemUI.toastLayer.show("Welcome!");

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave() {
    const { saved } = await saveArticle(engine, crud, createPage.inputs, auth.state.user.value);
    if (saved) {
      clearArticleInputs(createPage.inputs);
      pageSwitcher.show(listPage.pageNode);
      crud.load();
    }
  }

  async function handleLogin() {
    const username = loginPage.usernameNode.value.trim();
    const password = loginPage.passwordNode.value;

    if (!username || !password) {
      loginPage.setStatus("Enter both username and password.", "#FCA5A5");
      return;
    }

    const result = await auth.login({ username, password });

    if (!result.ok) {
      loginPage.setStatus(result.error ?? "Login failed.", "#FCA5A5");
      return;
    }

    loginPage.setStatus("Signed in successfully.", "#86EFAC");
    loginPage.clearForm();
    pageSwitcher.show(listPage.pageNode);
    engine.systemUI.toastLayer.show("Admin login successful");
  }

  async function handleLogout() {
    await auth.logout();
    pageSwitcher.show(listPage.pageNode);
    engine.systemUI.toastLayer.show("Signed out");
  }
}