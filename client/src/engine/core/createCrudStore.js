import { createAppStore } from "./createAppStore.js";

/**
 * createCrudStore – minimal reactive store for list + load + save.
 *
 * Usage (≈10 lines per app):
 *
 *   const crud = engine.ui.createCrudStore({
 *     listUrl:  '/api/blog/articles',
 *     saveUrl:  '/api/blog/articles',
 *     itemsKey: 'articles',
 *     onSaved:      (item)  => engine.systemUI.toastLayer.show("Saved"),
 *     onSaveError:  (error) => engine.systemUI.toastLayer.show("Save failed"),
 *     onLoadError:  (error) => console.error(error),
 *   });
 *
 *   // reactive signals
 *   crud.state.articles   – SignalImpl<Array>
 *   crud.state.isLoading  – SignalImpl<boolean>
 *   crud.state.isSaving   – SignalImpl<boolean>
 *   crud.state.error      – SignalImpl<string|null>
 *
 *   // actions (hoisted-style, safe to call anywhere)
 *   await crud.load();
 *   await crud.save(payload);
 */
export function createCrudStore({
  listUrl,
  saveUrl,
  method = "POST",
  itemsKey = "items",
  idKey,
  itemUrl,
  onSaved,
  onSaveError,
  onLoadError,
} = {}) {
  if (!listUrl) throw new Error("createCrudStore: listUrl is required");
  if (!saveUrl) throw new Error("createCrudStore: saveUrl is required");

  const store = createAppStore({
    [itemsKey]: [],
    currentItem: null,
    isLoading: false,
    isSaving: false,
    error: null,
  });

  async function load() {
    store.set({ isLoading: true, error: null });

    try {
      const response = await fetch(listUrl);
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load");
      }

      store.set({
        [itemsKey]: Array.isArray(payload.data) ? payload.data : [],
        isLoading: false,
      });
    } catch (error) {
      store.set({ isLoading: false, error: error?.message ?? "Load failed" });
      onLoadError?.(error);
    }
  }

  async function loadOne(id) {
    store.set({ isLoading: true, error: null });
    try {
      const targetUrl = typeof itemUrl === "function"
        ? itemUrl(id)
        : `${listUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}`;

      const response = await fetch(targetUrl);
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load");
      }

      store.set({ isLoading: false, currentItem: payload.data });
      return payload.data;
    } catch (error) {
      store.set({ isLoading: false, error: error?.message ?? "Load failed" });
      onLoadError?.(error);
      return null;
    }
  }

  async function save(itemPayload) {
    store.set({ isSaving: true, error: null });

    try {
      const response = await fetch(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemPayload),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to save");
      }

      const savedItem = payload?.data ?? itemPayload;
      store.update(itemsKey, (items) => {
        if (!idKey || !savedItem?.[idKey]) {
          return [savedItem, ...items];
        }

        const existingIndex = items.findIndex((item) => item?.[idKey] === savedItem[idKey]);

        if (existingIndex === -1) {
          return [savedItem, ...items];
        }

        const nextItems = items.slice();
        nextItems[existingIndex] = savedItem;
        return nextItems;
      });
      store.set({ isSaving: false, currentItem: savedItem });
      onSaved?.(savedItem);
      return savedItem;
    } catch (error) {
      store.set({ isSaving: false, error: error?.message ?? "Save failed" });
      onSaveError?.(error);
      return null;
    }
  }

  return {
    state: store.state,
    set: store.set,
    update: store.update,
    snapshot: store.snapshot,
    load,
    loadOne,
    save,
  };
}
