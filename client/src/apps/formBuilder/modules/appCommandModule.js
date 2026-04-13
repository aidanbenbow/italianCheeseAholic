import { BaseModule } from "../../../engine/modules/BaseModule.js";

export class AppCommandsModule extends BaseModule {
  attach() {
    this.engine.commands.register("form:Save", this.saveForm);
  }

  detach() {
    this.engine.commands.unregister("form:Save");
  }

  saveForm=(formData) => {
    console.log("Saving form data:", formData);
    // Here you would typically send the formData to your backend or save it in your state management system
  }
}