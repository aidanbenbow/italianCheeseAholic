// /engine/modules/text/ClipboardController.js

export class ClipboardController {
  constructor(system) {
    this.system = system;
    this.proxy = null;
  }

  mount() {
    this.createProxy();
  }

  destroy() {
    this.proxy?.remove();
  }

  // -------------------------------------------------------
  // Hidden textarea for fallback clipboard operations
  // -------------------------------------------------------

  createProxy() {
    this.proxy = document.createElement("textarea");

    Object.assign(this.proxy.style, {
      position: "fixed",
      opacity: "0",
      background: "transparent",
      color: "transparent",
      border: "none",
      resize: "none",
      outline: "none",
      fontSize: "16px"
    });

    document.body.appendChild(this.proxy);
  }

  // -------------------------------------------------------
  // Copy
  // -------------------------------------------------------

  async copy() {
    const text = this.system.selection.getRangeText();
    if (!text) return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {}
    }

    // Fallback
    this.proxy.value = text;
    this.proxy.select();
    document.execCommand("copy");
    this.proxy.value = "";
  }

  // -------------------------------------------------------
  // Cut
  // -------------------------------------------------------

  async cut() {
    const text = this.system.selection.getRangeText();
    if (!text) return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    } else {
      this.proxy.value = text;
      this.proxy.select();
      document.execCommand("copy");
      this.proxy.value = "";
    }

    this.system.replaceSelection("");
  }

  // -------------------------------------------------------
  // Paste
  // -------------------------------------------------------

  async paste() {
    if (navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.system.replaceSelection(text);
          return;
        }
      } catch {}
    }

    // Mobile fallback
    this.system.pastePrompt.show();
  }
}