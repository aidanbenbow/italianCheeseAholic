function mergeStyle(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

function collectInputValues(inputs) {
  const values = {};
  for (const [id, node] of inputs.entries()) {
    values[id] = node.value ?? "";
  }
  return values;
}

function validateField(field, value) {
  const rules = field.validation ?? [];

  for (const rule of rules) {
    if (rule.type === "required") {
      const text = `${value ?? ""}`.trim();
      if (!text) {
        return rule.message || `${field.label ?? field.id} is required`;
      }
    }

    if (rule.type === "minLength") {
      const min = Number(rule.value ?? 0);
      if (`${value ?? ""}`.length < min) {
        return rule.message || `${field.label ?? field.id} must be at least ${min} characters`;
      }
    }

    if (rule.type === "maxLength") {
      const max = Number(rule.value ?? Infinity);
      if (`${value ?? ""}`.length > max) {
        return rule.message || `${field.label ?? field.id} must be at most ${max} characters`;
      }
    }

    if (rule.type === "pattern") {
      const expression = typeof rule.value === "string" ? rule.value : "";
      if (!expression) continue;

      const regex = new RegExp(expression);
      if (!regex.test(`${value ?? ""}`)) {
        return rule.message || `${field.label ?? field.id} format is invalid`;
      }
    }
  }

  return null;
}

function validateForm(schema, values) {
  const errors = [];
  for (const field of schema.fields ?? []) {
    if (!["input", "textarea"].includes(field.type)) continue;
    const message = validateField(field, values[field.id]);
    if (message) {
      errors.push({ fieldId: field.id, message });
    }
  }
  return errors;
}

function runSuccessEffects(engine, action, inputs, statusNode) {
  const effects = action?.onSuccess ?? [];

  for (const effect of effects) {
    if (effect.type === "resetForm") {
      for (const inputNode of inputs.values()) {
        inputNode.value = "";
      }
      continue;
    }

    if (effect.type === "toast") {
      engine.systemUI?.toastLayer?.show?.(effect.message ?? "Done");
      continue;
    }
  }

  if (statusNode) {
    statusNode.text = "Saved";
    statusNode.requestRender?.();
  }
}

function runSubmitAction(engine, schema, values, inputs, statusNode) {
  const submitComponent = (schema.components ?? []).find((component) => component.type === "button");
  const actionKey = submitComponent?.action;
  const action = actionKey ? schema.actions?.[actionKey] : null;

  if (!action) {
    console.log("Dorcas form submitted", { formId: schema.formId, values });
    engine.systemUI?.toastLayer?.show?.("Form submitted");
    return;
  }

  if (action.type === "save") {
    console.log("Dorcas form save action", {
      collection: action.collection,
      formId: schema.formId,
      values
    });
    runSuccessEffects(engine, action, inputs, statusNode);
    return;
  }

  console.warn("Unsupported submit action type", action.type);
}

export function createFormFromSchema(engine, schema) {
  const theme = schema.theme ?? {};

  const page = engine.ui.createScrollableNode({
    id: `dorcas-form-${schema.formId}`,
    spacing: schema.layout?.gap ?? 12,
    style: mergeStyle(
      { width: 460, minHeight: 520, paddingTop: 16 },
      theme.page
    )
  });

  const titleNode = engine.ui.createTextNode({
    id: `${schema.formId}-title`,
    style: mergeStyle(
      { width: 420, height: 28, font: "16px sans-serif", color: "#ffffff" },
      theme.label
    )
  });
  titleNode.text = schema.title ?? "Form";
  engine.ui.mountNode(titleNode, page);

  const statusNode = engine.ui.createTextNode({
    id: `${schema.formId}-status`,
    style: { width: 420, height: 20, color: "#fca5a5", font: "12px sans-serif" }
  });
  statusNode.text = "";
  engine.ui.mountNode(statusNode, page);

  const inputs = new Map();

  for (const field of schema.fields ?? []) {
    const labelNode = engine.ui.createTextNode({
      id: `${schema.formId}-${field.id}-label`,
      style: mergeStyle({ width: 420, height: 18, font: "12px sans-serif" }, theme.label)
    });
    labelNode.text = field.label ?? field.id;
    engine.ui.mountNode(labelNode, page);

    if (field.type === "input" || field.type === "textarea") {
      const inputNode = engine.ui.createInputNode({
        id: field.id,
        placeholder: field.placeholder ?? "",
        multiline: field.type === "textarea",
        autoGrow: field.type === "textarea",
        style: mergeStyle(
          {
            width: 420,
            minHeight: field.type === "textarea" ? 100 : 40,
            paddingLeft: 12,
            paddingTop: field.type === "textarea" ? 10 : 0
          },
          theme.input
        )
      });

      inputs.set(field.id, inputNode);
      engine.ui.mountNode(inputNode, page);
    }
  }

  for (const component of schema.components ?? []) {
    if (component.type !== "button") continue;

    const submitButton = engine.ui.createButtonNode({
      id: `${schema.formId}-${component.action ?? "submit"}`,
      label: component.label ?? "Submit",
      style: mergeStyle({ minHeight: 38, paddingX: 14 }, theme.button),
      onPress: () => {
        const values = collectInputValues(inputs);
        const errors = validateForm(schema, values);

        if (errors.length > 0) {
          statusNode.text = errors[0].message;
          statusNode.requestRender?.();
          engine.systemUI?.toastLayer?.show?.(errors[0].message);
          return;
        }

        statusNode.text = "";
        statusNode.requestRender?.();
        runSubmitAction(engine, schema, values, inputs, statusNode);
      }
    });

    engine.ui.mountNode(submitButton, page);
  }

  return page;
}
