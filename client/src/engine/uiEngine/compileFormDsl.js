import { createFormInstance } from "./formInstance.js";

export function compileFormDsl(engine, dsl, { initialValues = {}, initialReport = null, onSubmit = null, formInstance = null } = {}) {
  if (!dsl || dsl.kind !== "form") {
    throw new Error("compileFormDsl expected a form DSL node");
  }

  const resolvedFormInstance = formInstance ?? createFormInstance({
    schema: dsl,
    initialValues,
    initialReport,
  });

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
    formInstance: resolvedFormInstance,
  };

  const inputDisposers = [];

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

      refs.fields.set(child.id, child);
      refs.inputs.set(child.id, inputNode);
      resolvedFormInstance.registerInput(child.id, inputNode);

      const handleValueChanged = () => {
        resolvedFormInstance.setValue(child.id, inputNode.value ?? "");
        resolvedFormInstance.setTouched(child.id, true);
      };

      inputNode.on("value:changed", handleValueChanged);
      inputDisposers.push(() => {
        inputNode.off("value:changed", handleValueChanged);
        resolvedFormInstance.unregisterInput(child.id);
      });

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
              const values = resolvedFormInstance.collectValues();

              if (typeof child.commandArgs === "function") {
                return child.commandArgs({
                  action: child,
                  values,
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
              const values = resolvedFormInstance.collectValues();
              for (const fieldId of refs.inputs.keys()) {
                resolvedFormInstance.setTouched(fieldId, true);
              }

              if (typeof child.onPress === "function") {
                await child.onPress({
                  action: child,
                  values,
                  refs,
                  dsl,
                });
                return;
              }

              if (typeof onSubmit !== "function") return;

              await onSubmit({
                action: child,
                values,
                refs,
                dsl,
              });
            },
      });

      refs.actions.set(child.id, child);
      engine.ui.mountNode(buttonNode, page);
    }
  }

  page.onDispose(() => {
    for (const dispose of inputDisposers) {
      dispose();
    }
  });

  return refs;
}