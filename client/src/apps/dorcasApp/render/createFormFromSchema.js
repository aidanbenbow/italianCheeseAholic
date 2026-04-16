function mergeStyle(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

function createReportPayload(schema, values, currentReport) {
  const now = Date.now();

  return {
    reportId: currentReport?.reportId ?? `report-${now}`,
    formId: schema.formId,
    title: schema.title ?? "Progress report",
    values,
    reporterName: values.name ?? "",
    createdAt: currentReport?.createdAt ?? now,
    updatedAt: now,
  };
}

function getReportValues(report) {
  if (!report || typeof report !== "object") return {};

  if (report.values && typeof report.values === "object") {
    return report.values;
  }

  if (report.data && typeof report.data === "object") {
    return report.data;
  }

  return report;
}

function getReportName(report) {
  if (!report || typeof report !== "object") return "";

  const candidate = report.reporterName
    ?? report.values?.name
    ?? report.data?.name
    ?? report.name;

  return typeof candidate === "string" ? candidate.trim() : "";
}

function filterReportsByName(reports, query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();

  return reports
    .map((report) => ({
      report,
      label: getReportName(report)
    }))
    .filter((entry) => entry.label)
    .filter((entry) => {
      if (!normalizedQuery) return true;
      return entry.label.toLowerCase().includes(normalizedQuery);
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

function resolveSuggestionAnchor(inputNode) {
  const bounds = inputNode?.bounds ?? {};
  const style = inputNode?.style ?? {};

  const width = Number.isFinite(bounds.width) && bounds.width > 0
    ? bounds.width
    : Number(style.width) || 220;
  const height = Number.isFinite(bounds.height) && bounds.height > 0
    ? bounds.height
    : Number(style.height) || Number(style.minHeight) || 40;
  const x = Number.isFinite(bounds.x) ? bounds.x : 0;
  const y = Number.isFinite(bounds.y) ? bounds.y : 0;

  return {
    x,
    y: y + height + 4,
    width,
  };
}

function applyReportToInputs(report, inputs) {
  const values = getReportValues(report);

  for (const [fieldId, inputNode] of inputs.entries()) {
    inputNode.value = values[fieldId] == null ? "" : `${values[fieldId]}`;
  }
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

async function runSubmitAction(engine, schema, values, inputs, statusNode, crud, getCurrentReport, setCurrentReport) {
  const submitComponent = (schema.components ?? []).find((component) => component.type === "button");
  const actionKey = submitComponent?.action;
  const action = actionKey ? schema.actions?.[actionKey] : null;

  if (!action) {
    console.log("Dorcas form submitted", { formId: schema.formId, values });
    engine.systemUI?.toastLayer?.show?.("Form submitted");
    return;
  }

  if (action.type === "save") {
    const savedReport = crud
      ? await crud.save(createReportPayload(schema, values, getCurrentReport()))
      : createReportPayload(schema, values, getCurrentReport());

    if (!savedReport) {
      const message = crud?.state?.error?.value ?? "Failed to save report";
      if (statusNode) {
        statusNode.text = message;
        statusNode.requestRender?.();
      }
      engine.systemUI?.toastLayer?.show?.(message);
      return;
    }

    setCurrentReport(savedReport);
    runSuccessEffects(engine, action, inputs, statusNode);
    return;
  }

  console.warn("Unsupported submit action type", action.type);
}

export function createFormFromSchema(engine, schema, { crud = null, initialReport = null } = {}) {
  const theme = schema.theme ?? {};
  let currentReport = initialReport;
  let suppressNameSuggestions = false;

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
  statusNode.text = initialReport?.reportId ? `Loaded ${initialReport.reportId}` : "";
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

  const initialValues = getReportValues(initialReport);
  for (const [fieldId, inputNode] of inputs.entries()) {
    if (initialValues[fieldId] == null) continue;
    inputNode.value = `${initialValues[fieldId]}`;
  }

  const nameInputNode = inputs.get("name") ?? null;
  const dropdownLayer = engine.systemUI?.dropDownLayer ?? null;
  const dropdownId = `${schema.formId}-report-name-suggestions`;

  if (nameInputNode && dropdownLayer && crud?.state?.reports) {
    const showNameSuggestions = ({ forceAll = false } = {}) => {
      if (suppressNameSuggestions || engine.context.focus !== nameInputNode) {
        dropdownLayer.hide(dropdownId);
        return;
      }

      const query = forceAll ? "" : nameInputNode.value;
      const matchingReports = filterReportsByName(
        crud.state.reports.value ?? [],
        query
      );

      if (matchingReports.length === 0) {
        dropdownLayer.hide(dropdownId);
        return;
      }

      const anchor = resolveSuggestionAnchor(nameInputNode);

      dropdownLayer.show(
        dropdownId,
        matchingReports.map(({ label, report }) => ({
          label,
          onSelect: () => {
            suppressNameSuggestions = true;
            currentReport = report;
            applyReportToInputs(report, inputs);
            statusNode.text = report?.reportId ? `Loaded ${report.reportId}` : "Loaded report";
            statusNode.requestRender?.();
            Promise.resolve().then(() => {
              suppressNameSuggestions = false;
            });
          }
        })),
        {
          x: anchor.x,
          y: anchor.y
        },
        {
          itemHeight: 34,
          style: {
            width: anchor.width,
            maxHeight: 220,
            background: "#F8FAFC",
            borderColor: "#CBD5E1"
          }
        }
      );
    };

    const hideNameSuggestions = () => {
      dropdownLayer.hide(dropdownId);
    };

    const handleNameValueChanged = () => {
      showNameSuggestions();
    };

    const handleFocusChanged = () => {
      if (engine.context.focus === nameInputNode) {
        showNameSuggestions({ forceAll: true });
        return;
      }

      hideNameSuggestions();
    };

    nameInputNode.on("value:changed", handleNameValueChanged);
    const offFocusChanged = engine.on("focus:changed", handleFocusChanged);

    page.onDispose(() => {
      nameInputNode.off("value:changed", handleNameValueChanged);
      offFocusChanged?.();
      hideNameSuggestions();
    });
  }

  for (const component of schema.components ?? []) {
    if (component.type !== "button") continue;

    const submitButton = engine.ui.createButtonNode({
      id: `${schema.formId}-${component.action ?? "submit"}`,
      label: component.label ?? "Submit",
      style: mergeStyle({ minHeight: 38, paddingX: 14 }, theme.button),
      onPress: async () => {
        if (crud?.state?.isSaving?.value) return;

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
        await runSubmitAction(
          engine,
          schema,
          values,
          inputs,
          statusNode,
          crud,
          () => currentReport,
          (nextReport) => {
            currentReport = nextReport;
          }
        );
      }
    });

    engine.ui.mountNode(submitButton, page);
  }

  return page;
}
