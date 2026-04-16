export function createDorcasCrudStore(engine) {
  return engine.ui.createCrudStore({
    listUrl: "/api/dorcas/reports",
    saveUrl: "/api/dorcas/reports",
    itemsKey: "reports",
    idKey: "reportId",
    onSaved: () => engine.systemUI?.toastLayer?.show?.("Report saved"),
    onSaveError: (error) => {
      engine.systemUI?.toastLayer?.show?.("Report save failed");
      console.error("Dorcas report save failed", error);
    },
    onLoadError: (error) => {
      engine.systemUI?.toastLayer?.show?.("Report load failed");
      console.error("Dorcas reports fetch failed", error);
    },
  });
}