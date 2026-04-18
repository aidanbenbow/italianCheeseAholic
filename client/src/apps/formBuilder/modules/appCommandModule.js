import { BaseModule } from "../../../engine/modules/BaseModule.js";

export class AppCommandsModule extends BaseModule {
  attach() {
    this.engine.commands.register("form:save", this.saveForm);
  }

  detach() {
    this.engine.commands.unregister("form:save");
  }

 saveForm = async (formData) => {
  try {
    const answers = formData?.answers ?? {
      name: formData?.name,
      institution: formData?.institution,
      feedback: formData?.feedback,
    };

    const res = await fetch(`/forms/${formData.formId}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(answers)
    });

    const payload = await res.json();

    if (!res.ok || !payload?.ok) {
      throw new Error(payload?.error || "Failed to submit");
    }

    this.engine.systemUI.toastLayer.show("Form submitted ✅");

  } catch (err) {
    console.error(err);
    this.engine.systemUI.toastLayer.show("Submit failed ❌");
  }
};
}