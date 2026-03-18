export function mount(engine) {
  const bannerText = engine.ui.signal("Blog booting...");

  const bannerNode = engine.ui.createTextNode({
    id: "blog-banner",
    style: {
      x: 20,
      y: 20,
      width: 260,
      height: 36,
      background: "#0F172A",
      color: "#b2abab",
      font: "14px sans-serif"
    },
    behavior: {
      measure(node) {
        return {
          width: node.style.width ?? 260,
          height: node.style.height ?? 36
        };
      },
      render(node, ctx) {
        ctx.fillStyle = node.style.background ?? "#0F172A";
        ctx.fillRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height);
        ctx.fillStyle = node.style.color ?? "#FFFFFF";
        ctx.font = node.style.font ?? "14px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(node.text ?? "", node.bounds.x + 50, node.bounds.y + node.bounds.height / 2);
      }
    }
  });

  engine.ui.mountNode(bannerNode);
  engine.ui.bindText(bannerNode, bannerText);

  setTimeout(() => {
    bannerText.value = "Blog ready";
  }, 800);

  engine.systemUI.toastLayer.show("Welcome!");
  engine.systemUI.popupLayer.show("intro", "Get started");
}


