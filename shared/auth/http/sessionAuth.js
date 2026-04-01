export function resolveUserRole(user = {}) {
  if (typeof user?.role === "string" && user.role.trim()) {
    return user.role.trim().toLowerCase();
  }

  if (user?.username === "admin" || user?.userId === "admin") {
    return "admin";
  }

  return "user";
}

export function toPublicUser(user = {}) {
  if (!user) return null;

  return {
    userId: user.userId ?? user.username ?? null,
    username: user.username ?? user.userId ?? null,
    role: resolveUserRole(user),
  };
}

export function getSessionUser(req) {
  return req?.session?.user ?? null;
}

export function requireAdminHttp(req, res, next) {
  const user = getSessionUser(req);

  if (!user) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }

  if (user.role !== "admin") {
    res.status(403).json({ ok: false, error: "Admin access required" });
    return;
  }

  next();
}
