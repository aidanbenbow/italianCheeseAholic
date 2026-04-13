export function renderForm(engine, form) {
  const theme = form.theme || {};

  // -------------------------
  // PAGE
  // -------------------------
  const page = engine.ui.createScrollableNode({
    id: `form-${form.formId}`,
    style: theme.page || {}
  });

  // -------------------------
  // TITLE
  // -------------------------
  const title = engine.ui.createTextNode({
    id: `${form.formId}-title`,
    style: {
      font: "16px sans-serif",
      color: theme.label?.color || "#fff",
      marginBottom: 16
    }
  });

  title.text = form.title;
  engine.ui.mountNode(title, page);

  // -------------------------
  // INPUT COLLECTION
  // -------------------------
  const inputs = {};

  // -------------------------
  // FIELDS
  // -------------------------
  for (const field of form.fields) {
    let node;

    // -------------------------
    // TEXT (DISPLAY ONLY)
    // -------------------------
    if (field.type === "text") {
      node = engine.ui.createTextNode({
        id: field.id,
        style: theme.label || {}
      });

      node.text = field.text || "";
    }

    // -------------------------
    // INPUT (EDITABLE)
    // -------------------------
    if (field.type === "input") {
      node = engine.ui.createInputNode({
        id: field.id,
        placeholder: field.placeholder || "",
        style: theme.input || {},
        multiline: false
      });

      inputs[field.id] = node;
    }

    if (node) {
      engine.ui.mountNode(node, page);
    }
  }

  // -------------------------
  // BUTTON
  // -------------------------
  const button = engine.ui.createButtonNode({
    id: `${form.formId}-submit`,
    label: "Submit",
    style: theme.button || {},
    command: "form:submit",

    commandArgs: () => {
      const values = {};

      for (const key in inputs) {
        values[key] = inputs[key].value;
      }

      return {
        formId: form.formId,
        answers: values
      };
    }
  });

  engine.ui.mountNode(button, page);

  return page;
}