import { compileFormDsl } from "./compileFormDsl.js";
import { buildFormDslFromSchema } from "./formDsl.js";

function mergeStyle(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

const SUGGESTION_CONFIG = {
  itemHeight: 34,
  maxHeight: 220,
  hideDelay: 80
};

function createReportPayload(schema, values, currentReport) {
  const now = new Date();
  const nowIso = now.toISOString();
  const year2 = now.getUTCFullYear() % 100;
  const reportId = currentReport?.reportId ?? currentReport?.id ?? `report-${now.getTime()}`;

  return {
    reportId,
    id: currentReport?.id ?? reportId,
    name: values.name ?? "",
    message: values.message ?? "",
    report: values.feedback ?? "",
    createdAt: currentReport?.createdAt ?? nowIso,
    updatedAt: nowIso,
    messageYear: Number.isFinite(currentReport?.messageYear) ? currentReport.messageYear : year2,
    reportYear: Number.isFinite(currentReport?.reportYear) ? currentReport.reportYear : year2,
    status: currentReport?.status ?? "sponsored",
    used: typeof currentReport?.used === "boolean" ? currentReport.used : true,
    letter: typeof currentReport?.letter === "boolean" ? currentReport.letter : false,
  };
}

function normalizeReport(report) {
  if (!report || typeof report !== "object") return {};

  return {
    ...report,
    ...(report.data || {}),
    ...(report.values || {})
  };
}

function getReportValues(report) {
  return normalizeReport(report);
}

function getReportName(report) {
  const normalized = normalizeReport(report);
  const candidate = normalized.reporterName ?? normalized.name;

  return typeof candidate === "string" ? candidate.trim() : "";
}

function buildSuggestionItems(reports, query, getLabel) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();

  return reports
    .map((report) => ({
      report,
      label: getLabel(report)
    }))
    .filter((item) => item.label)
    .filter((item) => {
      if (!normalizedQuery) return true;
      return item.label.toLowerCase().includes(normalizedQuery);
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function resolveSuggestionAnchor(inputNode, {
  engine = null,
  itemCount = 0,
  itemHeight = 34,
  maxHeight = 220
} = {}) {
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

  const requestedHeight = Math.min(maxHeight, Math.max(0, itemCount * itemHeight));

  const keyboardBounds = engine?.systemUI?.keyboardLayer?.view?.panelNode?.bounds ?? null;
  const keyboardVisible = engine?.systemUI?.keyboardLayer?.isVisible === true;
  const keyboardTop = keyboardVisible && Number.isFinite(keyboardBounds?.y)
    ? keyboardBounds.y
    : Infinity;

  const belowY = y + height + 4;
  const wouldIntersectKeyboard = (belowY + requestedHeight) > (keyboardTop - 4);

  const preferredY = wouldIntersectKeyboard
    ? Math.max(8, y - requestedHeight - 4)
    : belowY;

  return {
    x,
    y: preferredY,
    width,
  };
}

function getDropdownStyle(anchor, {
  itemHeight = SUGGESTION_CONFIG.itemHeight,
  maxHeight = SUGGESTION_CONFIG.maxHeight
} = {}) {
  return {
    itemHeight,
    style: {
      width: anchor.width,
      maxHeight,
      background: "#F8FAFC",
      borderColor: "#CBD5E1"
    }
  };
}

function createSuggestionController({ hideDelay = 80 } = {}) {
  let suppress = false;
  let interacting = false;
  let hideTimeout = null;
  let forceAll = false;

  return {
    shouldShow(engine, inputNode) {
      return !suppress && engine.context.focus === inputNode;
    },

    getQuery(inputNode) {
      return forceAll ? "" : inputNode.value;
    },

    forceOpen() {
      forceAll = true;
      Promise.resolve().then(() => {
        forceAll = false;
      });
    },

    onSelectStart() {
      suppress = true;
    },

    onSelectEnd() {
      Promise.resolve().then(() => {
        suppress = false;
      });
    },

    startInteraction() {
      interacting = true;
      this.clearHideTimer();
    },

    endInteraction() {
      interacting = false;
    },

    isInteracting() {
      return interacting;
    },

    scheduleHide(callback) {
      this.clearHideTimer();
      hideTimeout = setTimeout(callback, hideDelay);
    },

    clearHideTimer() {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    },

    dispose() {
      this.clearHideTimer();
    }
  };
}

function attachNameSuggestions({
  engine,
  inputNode,
  dropdownLayer,
  reportsState,
  getLabel,
  onSelect
}) {
  if (!inputNode || !dropdownLayer || !reportsState) {
    return () => {};
  }

  const dropdownId = `suggestions-${inputNode.id}`;
  const controller = createSuggestionController({ hideDelay: SUGGESTION_CONFIG.hideDelay });

  const show = () => {
    controller.clearHideTimer();

    if (!controller.shouldShow(engine, inputNode)) {
      dropdownLayer.hide(dropdownId);
      return;
    }

    const query = controller.getQuery(inputNode);
    const items = buildSuggestionItems(reportsState.value ?? [], query, getLabel);

    if (!items.length) {
      dropdownLayer.hide(dropdownId);
      return;
    }

    const itemHeight = SUGGESTION_CONFIG.itemHeight;
    const maxHeight = SUGGESTION_CONFIG.maxHeight;
    const anchor = resolveSuggestionAnchor(inputNode, {
      engine,
      itemCount: items.length,
      itemHeight,
      maxHeight
    });

    dropdownLayer.show(
      dropdownId,
      items.map(({ label, report }) => ({
        label,
        onSelect: () => {
          controller.onSelectStart();
          onSelect(report);
          controller.onSelectEnd();
        }
      })),
      { x: anchor.x, y: anchor.y },
      getDropdownStyle(anchor, { itemHeight, maxHeight })
    );
  };

  const hide = () => {
    controller.clearHideTimer();
    dropdownLayer.hide(dropdownId);
  };

  const handleValueChanged = () => show();

  const handleFocusChanged = () => {
    if (engine.context.focus === inputNode) {
      controller.forceOpen();
      show();
      return;
    }

    controller.scheduleHide(() => {
      if (!controller.isInteracting()) {
        hide();
      }
    });
  };

  const handleSceneEvent = (eventPayload) => {
    const targetId = String(eventPayload?.targetId ?? "");
    const type = String(eventPayload?.type ?? "");

    if (type === "pointerdown" && targetId.startsWith(`dropdown-${dropdownId}`)) {
      controller.startInteraction();
      return;
    }

    if (type === "pointerup") {
      controller.endInteraction();

      if (engine.context.focus !== inputNode) {
        hide();
      }
    }
  };

  inputNode.on("value:changed", handleValueChanged);
  const offFocus = engine.on("focus:changed", handleFocusChanged);
  const offScene = engine.on("input:scene-event", handleSceneEvent);

  return () => {
    inputNode.off("value:changed", handleValueChanged);
    offFocus?.();
    offScene?.();
    controller.dispose();
    hide();
  };
}

function resolveReportValue(report, key) {
  const normalizedKey = key === "name" ? "name" : key;
  const normalized = normalizeReport(report);

  const aliases = {
    feedback: ["feedback", "report"],
    report: ["report", "feedback"],
    message: ["message"],
    name: ["name", "reporterName"],
  };

  const keys = aliases[normalizedKey] ?? [normalizedKey];

  for (const candidate of keys) {
    if (normalized?.[candidate] != null) return normalized[candidate];
  }

  if (normalizedKey === "name") {
    return getReportName(report);
  }

  return null;
}

function mapReportToValues(report, fieldIds) {
  const mapped = {};

  for (const fieldId of fieldIds) {
    mapped[fieldId] = resolveReportValue(report, fieldId);
  }

  return mapped;
}

function applyValuesToInputs(values, inputs) {
  for (const [fieldId, inputNode] of inputs.entries()) {
    const resolvedValue = values?.[fieldId];
    inputNode.value = resolvedValue == null ? "" : `${resolvedValue}`;
  }
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

    if (rule.type === "maxWords") {
      const max = Number(rule.value ?? Infinity);
      const wordCount = `${value ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > max) {
        return rule.message || `${field.label ?? field.id} must be at most ${max} words`;
      }
    }

    if (rule.type === "minWords") {
      const min = Number(rule.value ?? 0);
      const wordCount = `${value ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < min) {
        return rule.message || `${field.label ?? field.id} must be at least ${min} words`;
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
  let currentReport = initialReport;
  const dsl = buildFormDslFromSchema(schema);
  const {
    page,
    statusNode,
    inputs,
    fields,
  } = compileFormDsl(engine, dsl, {
    initialValues: getReportValues(initialReport),
    onSubmit: async ({ values }) => {
      if (crud?.state?.isSaving?.value) return;

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

  if (statusNode) {
    statusNode.text = initialReport?.reportId ? `Loaded ${initialReport.reportId}` : "";
    statusNode.requestRender?.();
  }

  const nameField = fields.get("name") ?? null;
  const nameInputNode = inputs.get("name") ?? null;
  const dropdownLayer = engine.systemUI?.dropDownLayer ?? null;

  if (nameField?.features?.suggestions && nameInputNode && dropdownLayer && crud?.state?.reports) {
    const disposeNameSuggestions = attachNameSuggestions({
      engine,
      inputNode: nameInputNode,
      dropdownLayer,
      reportsState: crud.state.reports,
      getLabel: getReportName,
      onSelect: (report) => {
        currentReport = report;
        const mappedValues = mapReportToValues(report, inputs.keys());
        applyValuesToInputs(mappedValues, inputs);
        statusNode.text = report?.reportId ? `Loaded ${report.reportId}` : "Loaded report";
        statusNode.requestRender?.();
      }
    });

    page.onDispose(() => {
      disposeNameSuggestions?.();
    });
  }

  return page;
}
