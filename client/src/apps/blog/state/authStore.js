export function createBlogAuthStore(engine) {
  const store = engine.ui.createStore({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    isSubmitting: false,
    error: null,
  });

  async function refresh() {
    store.set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "same-origin",
      });
      const payload = await response.json();
      const user = payload?.data ?? null;

      store.set({
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",
        isLoading: false,
        error: null,
      });
    } catch (error) {
      store.set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: error?.message ?? "Failed to load session",
      });
    }
  }

  async function login({ username, password }) {
    store.set({ isSubmitting: true, error: null });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Login failed");
      }

      const user = payload?.data ?? null;
      store.set({
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",
        isSubmitting: false,
        error: null,
      });

      return { ok: true, user };
    } catch (error) {
      store.set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isSubmitting: false,
        error: error?.message ?? "Login failed",
      });

      return { ok: false, error: error?.message ?? "Login failed" };
    }
  }

  async function logout() {
    store.set({ isSubmitting: true, error: null });

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      store.set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isSubmitting: false,
        error: null,
      });
    }
  }

  return {
    state: store.state,
    set: store.set,
    snapshot: store.snapshot,
    refresh,
    login,
    logout,
  };
}
