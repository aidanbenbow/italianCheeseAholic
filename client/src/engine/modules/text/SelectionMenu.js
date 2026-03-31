// /engine/modules/text/SelectionMenu.js

export class SelectionMenu {
  constructor(system) {
    this.system = system;
    this.el = null;
  }

  mount() {
    this.el = document.createElement("div");

    Object.assign(this.el.style, {
      position: "fixed",
      display: "none",
      gap: "6px",
      padding: "6px",
      background: "rgba(255, 255, 255, 0.9)",
      border: "1px solid #d0d0d0",
      borderRadius: "8px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      zIndex: "9999",
      fontFamily: "Segoe UI, Tahoma, sans-serif"
    });

    this.addButton("Cut", () => this.system.clipboard.cut());
    this.addButton("Copy", () => this.system.clipboard.copy());
    this.addButton("Paste", () => this.system.clipboard.paste());
    this.addButton("Bold", () => this.system.replaceSelection("**" + this.system.selection.getRangeText() + "**"));

    document.body.appendChild(this.el);

    // Hide when clicking outside
    this._docHandler = (e) => {
      if (this.el.style.display === "none") return;
      if (!this.el.contains(e.target)) this.hide();
    };

    document.addEventListener("mousedown", this._docHandler);
  }

  destroy() {
    document.removeEventListener("mousedown", this._docHandler);
    this.el?.remove();
  }

  addButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;

    Object.assign(btn.style, {
      border: "1px solid #c7c7c7",
      background: "#f7f7f7",
      borderRadius: "6px",
      padding: "4px 8px",
      cursor: "pointer",
      fontSize: "12px"
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      onClick();
      this.hide();
    });

    this.el.appendChild(btn);
  }

  showAt(clientX, clientY) {
    this.el.style.left = `${clientX}px`;
    this.el.style.top = `${clientY}px`;
    this.el.style.display = "flex";
  }

  showForSelection() {
    const canvasManager = this.system.engine.context.canvasManager;
    const ctx    = canvasManager?.getContext?.("main");
    const canvas = canvasManager?.getCanvas?.("main");
    if (!ctx || !canvas) return;

    const caretPos = this.system.caret.getScenePosition(ctx);

    const rect = canvas.getBoundingClientRect();

    const clientX = rect.left + (caretPos.x / canvas.width) * rect.width;
    const clientY = rect.top + (caretPos.y / canvas.height) * rect.height - 40;

    this.showAt(clientX, clientY);
  }

  hide() {
    this.el.style.display = "none";
  }
}