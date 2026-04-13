export function createFormBuilderCrudStore(engine) {
  return engine.ui.createCrudStore({
    listUrl:     '/forms', 
    saveUrl:     '/forms',
    itemsKey:    'forms',
    onSaved:      ()      => engine.systemUI.toastLayer.show("Form saved"),
    onSaveError:  (error) => {
        engine.systemUI.toastLayer.show("Save failed");
        console.error("Form save failed", error);
    },
    onLoadError:  (error) => {
        engine.systemUI.toastLayer.show("Load failed");
        console.error("Forms fetch failed", error);
    },
  });
}
