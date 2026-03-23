// /engine/modules/text/PastePrompt.js

export class PastePrompt {
  constructor(system) {
    this.system = system;
    this.el = null;
    this.input = null;
  }

  mount() {
    this.el = document.createElement("div");

    Object.assign(this.el.style, {
      position: "fixed",
      display: "none",
      flexDirection: "column",
      gap: "6px",
      padding: "8px 10px",
      background: "rgba(255, 255, 255, 0.95)",
      border: "1px solid #d0d0d0",
      borderRadius: "10px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
      zIndex: "10000",
      left: "50%",
      bottom: "240px",
      transform: "translateX(-50%)",
      fontFamily: "Segoe UI, Tahoma, sans-serif"
    });

    const label = document.createElement("div");
    label.textContent = "Tap and hold to paste";
    Object.assign(label.style, {
      fontSize: "12px",
      color: "#1f2937"
    });

    this.input = document.createElement("textarea");
    Object.assign(this.input.style, {
      width: "260px",
      height: "44px",
      resize: "none",
      padding: "6px 8px",
      borderRadius: "8px",
      border: "1px solid #c7c7c7",
      fontSize: "14px"
    });

    this.input.addEventListener("input", () => {
      const text = this.input.value;
      if (text) {
        this.system.replaceSelection(text);
        this.input.value = "";
        this.hide();
      }
    });

    this.el.appendChild(label);
    this.el.appendChild(this.input);
    document.body.appendChild(this.el);
  }

  show() {
    this.el.style.display = "flex";
    this.input.focus();
  }

  hide() {
    this.el.style.display = "none";
    this.input.blur();
  }
}