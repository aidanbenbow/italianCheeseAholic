import { buildFormDslFromSchema } from "../../../engine/uiEngine/formDsl.js";
import { compileFormDsl } from "../../../engine/uiEngine/compileFormDsl.js";

export function renderForm(engine, form) {
  const dsl = buildFormDslFromSchema(form, {
    pageId: `form-${form.formId}`,
    defaultTitleStyle: {
      font: "16px sans-serif",
      color: "#fff",
      marginBottom: 16,
    },
    mapAction: (actionNode) => ({
      ...actionNode,
      command: "form:save",
      commandArgs: ({ refs }) => ({
        formId: form.formId,
        answers: { ...(refs?.formInstance?.state?.values ?? {}) },
      }),
    }),
  });

  const { page } = compileFormDsl(engine, dsl);
  return page;
}