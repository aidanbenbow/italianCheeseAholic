import { createPageSwitcher } from "../formBuilder/layout/pageSwitcher.js";
import { createFormFromSchema } from "./render/createFormFromSchema.js";

async function loadReportSchema() {
  const schemaUrl = new URL("./pages/reportForm.json", import.meta.url);
  const response = await fetch(schemaUrl);

  if (!response.ok) {
    throw new Error(`Failed to load report form schema (${response.status})`);
  }

  return response.json();
}

export async function mount(engine) {
  const pageSwitcher = createPageSwitcher(engine);

  try {
    const formSchema = await loadReportSchema();
    const reportFormPage = createFormFromSchema(engine, formSchema);

    pageSwitcher.show(reportFormPage);
    engine.systemUI?.toastLayer?.show?.("Dorcas report form ready");
  } catch (error) {
    console.error("dorcasApp failed to mount", error);
    engine.systemUI?.toastLayer?.show?.("Failed to load report form");
  }
}
