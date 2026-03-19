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
      font: "14px sans-serif",
      paddingLeft: 50
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


