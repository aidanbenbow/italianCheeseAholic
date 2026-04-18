import { compileFormDsl } from "../../../../engine/uiEngine/compileFormDsl.js";
import { action, field, form } from "../../../../engine/uiEngine/formDsl.js";

export function createViewFormPage(engine, formId) {
  const dsl = form({
    id: "form-builder-view-page",
    formId: "form-builder-view",
    title: "Sokratov Klub",
    style: { background: "#304576" },
    titleStyle: {
      width: 400,
      height: 36,
      background: "#08205a",
      color: "#b2abab",
      font: "14px sans-serif",
      paddingLeft: 20,
      paddingTop: 8,
      marginBottom: 12,
    },
    children: [
      field.input({
        id: "name",
        label: "Name",
        placeholder: "Form Name",
        labelStyle: {
          width: 400,
          height: 20,
          color: "#b2abab",
          font: "12px sans-serif",
          paddingLeft: 4,
          marginBottom: 4,
        },
        inputStyle: {
          width: 420,
          height: 40,
          background: "#7989ad",
          borderColor: "#374151",
          color: "#ebe5e1",
          paddingLeft: 12,
          marginBottom: 12,
        },
      }),
      field.input({
        id: "institution",
        label: "Institution",
        placeholder: "Institution",
        labelStyle: {
          width: 400,
          height: 20,
          color: "#b2abab",
          font: "12px sans-serif",
          paddingLeft: 4,
          marginBottom: 4,
        },
        inputStyle: {
          width: 420,
          height: 40,
          background: "#7989ad",
          borderColor: "#374151",
          color: "#ebe5e1",
          paddingLeft: 12,
          marginBottom: 12,
        },
      }),
      field.textarea({
        id: "feedback",
        label: "Feedback",
        placeholder: "Feedback",
        labelStyle: {
          width: 400,
          height: 20,
          color: "#b2abab",
          font: "12px sans-serif",
          paddingLeft: 4,
          marginBottom: 4,
        },
        inputStyle: {
          width: 420,
          minHeight: 80,
          background: "#7989ad",
          borderColor: "#374151",
          color: "#ebe5e1",
          paddingLeft: 12,
          paddingTop: 12,
        },
      }),
      action.submit({
        id: "form-builder-view-save-button",
        label: "Save Changes",
        style: {
          font: "13px sans-serif",
          textColor: "#111827",
          background: "#E5E7EB",
          borderColor: "#9CA3AF",
          minHeight: 36,
          paddingX: 16,
          marginTop: 12,
        },
        command: "form:save",
        commandArgs: ({ values }) => ({
          formId,
          answers: {
            name: values.name,
            institution: values.institution,
            feedback: values.feedback,
          },
        }),
      }),
    ],
  });

  const { page } = compileFormDsl(engine, dsl);
  return page;
}
