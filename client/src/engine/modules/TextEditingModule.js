// /engine/modules/TextEditingModule.js
import { BaseModule } from "./BaseModule.js";
import { TextEditingSystem } from "./text/TextEditingSystem.js";

export class TextEditingModule extends BaseModule {
  constructor(engine) {
    super(engine, { id: "textEditing" });

    this.system = new TextEditingSystem(engine);
  }

  contextExports() {
    return {
      textEditor: this.system
    };
  }

  attach() {
    this.system.mount();
  }

  detach() {
    this.system.destroy();
  }
}