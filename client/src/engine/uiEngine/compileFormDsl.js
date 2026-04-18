function collectInputValues(inputs) {
  const values = {};

  for (const [id, node] of inputs.entries()) {
    values[id] = node.value ?? "";
  }

  return values;
}

export function compileFormDsl(engine, dsl, { initialValues = {}, onSubmit = null } = {}) {
  if (!dsl || dsl.kind !== "form") {
    throw new Error("compileFormDsl expected a form DSL node");
  }

  const page = engine.ui.createScrollableNode({
    id: dsl.id,
    spacing: dsl.layout?.gap ?? 12,
    style: dsl.style ?? {},
  });

  const titleNode = engine.ui.createTextNode({
    id: `${dsl.formId}-title`,
    style: dsl.titleStyle ?? {},
  });
  titleNode.text = dsl.title ?? "Form";
  engine.ui.mountNode(titleNode, page);

  const refs = {
    page,
    titleNode,
    statusNode: null,
    inputs: new Map(),
    fields: new Map(),
    actions: new Map(),
  };

  for (const child of dsl.children ?? []) {
    if (child.kind === "status") {
      const statusNode = engine.ui.createTextNode({
        id: child.id,
        style: child.style ?? {},
      });
      statusNode.text = child.text ?? "";
      engine.ui.mountNode(statusNode, page);
      refs.statusNode = statusNode;
      continue;
    }

    if (child.kind === "field" && child.control === "text") {
      const textNode = engine.ui.createTextNode({
        id: child.id,
        style: child.textStyle ?? {},
      });
      textNode.text = child.text ?? "";
      refs.fields.set(child.id, child);
      engine.ui.mountNode(textNode, page);
      continue;
    }

    if (child.kind === "field") {
      const labelNode = engine.ui.createTextNode({
        id: `${dsl.formId}-${child.id}-label`,
        style: child.labelStyle ?? {},
      });
      labelNode.text = child.label ?? child.id;
      engine.ui.mountNode(labelNode, page);

      const inputNode = engine.ui.createInputNode({
        id: child.id,
        placeholder: child.placeholder ?? "",
        multiline: child.multiline === true,
        autoGrow: child.autoGrow === true,
        style: child.inputStyle ?? {},
      });

      if (initialValues?.[child.id] != null) {
        inputNode.value = `${initialValues[child.id]}`;
      }

      refs.fields.set(child.id, child);
      refs.inputs.set(child.id, inputNode);
      engine.ui.mountNode(inputNode, page);
      continue;
    }

    if (child.kind === "action" && child.actionType === "submit") {
      const buttonNode = engine.ui.createButtonNode({
        id: child.id,
        label: child.label ?? "Submit",
        style: child.style ?? {},
        command: child.command ?? null,
        commandArgs: child.command
          ? () => {
              if (typeof child.commandArgs === "function") {
                return child.commandArgs({
                  action: child,
                  values: collectInputValues(refs.inputs),
                  refs,
                  dsl,
                });
              }

              return child.commandArgs ?? null;
            }
          : null,
        onPress: child.command
          ? null
          : async () => {
              if (typeof child.onPress === "function") {
                await child.onPress({
                  action: child,
                  values: collectInputValues(refs.inputs),
                  refs,
                  dsl,
                });
                return;
              }

              if (typeof onSubmit !== "function") return;

              await onSubmit({
                action: child,
                values: collectInputValues(refs.inputs),
                refs,
                dsl,
              });
            },
      });

      refs.actions.set(child.id, child);
      engine.ui.mountNode(buttonNode, page);
    }
  }

  return refs;
}