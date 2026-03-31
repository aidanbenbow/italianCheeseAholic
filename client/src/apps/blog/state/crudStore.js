/**
 * createBlogCrudStore
 * Thin factory so main.js stays free of API URLs and toast wiring.
 */
export function createBlogCrudStore(engine) {
  return engine.ui.createCrudStore({
    listUrl:     '/api/blog/articles',
    saveUrl:     '/api/blog/articles',
    itemsKey:    'articles',
    onSaved:      ()      => engine.systemUI.toastLayer.show("Article saved"),
    onSaveError:  (error) => {
      engine.systemUI.toastLayer.show("Save failed");
      console.error("Blog article save failed", error);
    },
    onLoadError:  (error) => console.error("Blog articles fetch failed", error),
  });
}
