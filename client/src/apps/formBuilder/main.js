export function mount(engine) {
  const uiText = engine.ui.signal("Hello, Form Builder!");
  const titleNode = engine.ui.createTextNode({id:"Form Builder",style: {
    x: 20,
    y: 20,
    width: 260,
    height: 36,
    background: "#0F172A",
    color: "#b2abab",
    font: "14px sans-serif",
    paddingLeft: 50
  }});
  engine.ui.mountNode(titleNode);
  engine.ui.bindText(titleNode, uiText);
}
