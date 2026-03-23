// /render/utils/timeUtils.js

export function now() {
  // Prefer high‑resolution timer when available
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}