import { buildFormDslFromSchema as buildSharedFormDslFromSchema } from "../../../engine/uiEngine/formDsl.js";

export * from "../../../engine/uiEngine/formDsl.js";

export function buildFormDslFromSchema(schema) {
  return buildSharedFormDslFromSchema(schema, {
    pageId: `dorcas-form-${schema.formId}`,
    includeStatus: true,
    statusNode: {
      id: `${schema.formId}-status`,
      style: { width: 420, height: 20, color: "#fca5a5", font: "12px sans-serif" },
    },
    defaultPageStyle: { width: 460, minHeight: 520, paddingTop: 16 },
    defaultTitleStyle: { width: 420, height: 28, font: "16px sans-serif", color: "#ffffff" },
    defaultLabelStyle: { width: 420, height: 18, font: "12px sans-serif" },
    defaultInputStyle: { width: 420, minHeight: 40, paddingLeft: 12, paddingTop: 0, paddingBottom: 0 },
    defaultTextareaStyle: { width: 420, minHeight: 100, paddingLeft: 12, paddingTop: 12, paddingBottom: 12 },
    defaultButtonStyle: { minHeight: 38, paddingX: 14 },
    mapField: (fieldNode, fieldSchema) => {
      if (fieldSchema.id !== "name") return fieldNode;

      return {
        ...fieldNode,
        features: {
          suggestions: {
            source: "reports",
          },
        },
      };
    },
  });
}