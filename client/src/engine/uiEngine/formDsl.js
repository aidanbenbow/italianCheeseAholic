import { getControlForSchemaType } from "./fieldRegistry.js";

function mergeStyle(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

function createDslNode(kind, config = {}) {
  return {
    kind,
    ...config,
  };
}

export function form(config = {}) {
  return createDslNode("form", {
    children: config.children ?? [],
    ...config,
  });
}

export function status(config = {}) {
  return createDslNode("status", config);
}

export const field = {
  text(config = {}) {
    return createDslNode("field", {
      control: "text",
      ...config,
    });
  },

  input(config = {}) {
    return createDslNode("field", {
      control: "input",
      ...config,
    });
  },

  textarea(config = {}) {
    return createDslNode("field", {
      control: "textarea",
      multiline: true,
      autoGrow: true,
      ...config,
    });
  },
};

export const action = {
  submit(config = {}) {
    return createDslNode("action", {
      actionType: "submit",
      ...config,
    });
  },
};

function createFieldDsl(fieldSchema, theme, options) {
  const control = getControlForSchemaType(fieldSchema.type);

  if (control === "text") {
    return field.text({
      id: fieldSchema.id,
      text: fieldSchema.text ?? fieldSchema.label ?? "",
      textStyle: mergeStyle(options.defaultTextStyle, theme.label),
    });
  }

  const fieldNode = field[control]({
    id: fieldSchema.id,
    label: fieldSchema.label ?? fieldSchema.id,
    placeholder: fieldSchema.placeholder ?? "",
    validation: fieldSchema.validation ?? [],
    labelStyle: mergeStyle(options.defaultLabelStyle, theme.label),
    inputStyle: mergeStyle(
      control === "textarea" ? options.defaultTextareaStyle : options.defaultInputStyle,
      theme.input
    ),
  });

  if (typeof options.mapField === "function") {
    return options.mapField(fieldNode, fieldSchema, schemaSafeTheme(theme)) ?? fieldNode;
  }

  return fieldNode;
}

function schemaSafeTheme(theme) {
  return theme ?? {};
}

function createActionDsl(schema, component, theme, options) {
  const actionNode = action.submit({
    id: `${schema.formId}-${component.action ?? "submit"}`,
    label: component.label ?? "Submit",
    actionKey: component.action ?? "submit",
    actionConfig: schema.actions?.[component.action ?? "submit"] ?? null,
    style: mergeStyle(options.defaultButtonStyle, theme.button),
  });

  if (typeof options.mapAction === "function") {
    return options.mapAction(actionNode, component, schema, schemaSafeTheme(theme)) ?? actionNode;
  }

  return actionNode;
}

export function buildFormDslFromSchema(schema, options = {}) {
  const theme = schema.theme ?? {};
  const components = schema.components ?? [];
  const resolvedOptions = {
    pageId: options.pageId ?? `form-${schema.formId}`,
    includeStatus: options.includeStatus === true,
    defaultPageStyle: options.defaultPageStyle ?? {},
    defaultTitleStyle: options.defaultTitleStyle ?? { font: "16px sans-serif", color: "#ffffff" },
    defaultTextStyle: options.defaultTextStyle ?? {},
    defaultLabelStyle: options.defaultLabelStyle ?? {},
    defaultInputStyle: options.defaultInputStyle ?? {},
    defaultTextareaStyle: options.defaultTextareaStyle ?? {},
    defaultButtonStyle: options.defaultButtonStyle ?? {},
    mapField: options.mapField ?? null,
    mapAction: options.mapAction ?? null,
    statusNode: options.statusNode ?? null,
  };

  const children = [
    ...(resolvedOptions.includeStatus
      ? [status({
          id: resolvedOptions.statusNode?.id ?? `${schema.formId}-status`,
          style: resolvedOptions.statusNode?.style ?? {},
          text: resolvedOptions.statusNode?.text ?? "",
        })]
      : []),
    ...(schema.fields ?? []).map((fieldSchema) => createFieldDsl(fieldSchema, theme, resolvedOptions)),
    ...components
      .filter((component) => component.type === "button")
      .map((component) => createActionDsl(schema, component, theme, resolvedOptions)),
  ];

  return form({
    id: resolvedOptions.pageId,
    formId: schema.formId,
    title: schema.title ?? "Form",
    layout: {
      gap: schema.layout?.gap ?? 12,
    },
    style: mergeStyle(resolvedOptions.defaultPageStyle, theme.page),
    titleStyle: mergeStyle(resolvedOptions.defaultTitleStyle, theme.label),
    children,
  });
}

export { mergeStyle };