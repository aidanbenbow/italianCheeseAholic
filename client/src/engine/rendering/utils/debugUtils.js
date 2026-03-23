// /render/utils/debugUtils.js

export function drawDebugPanel(ctx, rect, lines) {
  if (!ctx || !rect) return;

  ctx.save();
  ctx.font = "12px monospace";
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  ctx.fillStyle = "#93c5fd";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], rect.x + 6, rect.y + 16 + i * 14);
  }

  ctx.restore();
}