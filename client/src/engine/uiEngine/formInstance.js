function toText(value) {
  return value == null ? "" : `${value}`;
}

export function createFormInstance({ schema = null, initialValues = {}, initialReport = null } = {}) {
  const state = {
    values: { ...initialValues },
    errors: {},
    touched: {},
    currentReport: initialReport,
  };

  const inputs = new Map();

  return {
    schema,
    state,

    registerInput(fieldId, inputNode) {
      inputs.set(fieldId, inputNode);

      if (state.values[fieldId] != null) {
        inputNode.value = toText(state.values[fieldId]);
      } else {
        state.values[fieldId] = inputNode.value ?? "";
      }
    },

    unregisterInput(fieldId) {
      inputs.delete(fieldId);
    },

    setValue(fieldId, value) {
      state.values[fieldId] = value;

      const inputNode = inputs.get(fieldId);
      if (inputNode && inputNode.value !== toText(value)) {
        inputNode.value = toText(value);
      }
    },

    getValue(fieldId) {
      return state.values[fieldId];
    },

    setValues(values = {}, { markTouched = false } = {}) {
      for (const [fieldId, value] of Object.entries(values)) {
        state.values[fieldId] = value;
        if (markTouched) {
          state.touched[fieldId] = true;
        }

        const inputNode = inputs.get(fieldId);
        if (inputNode) {
          inputNode.value = toText(value);
        }
      }
    },

    collectValues() {
      const nextValues = { ...state.values };

      for (const [fieldId, inputNode] of inputs.entries()) {
        nextValues[fieldId] = inputNode.value ?? "";
      }

      state.values = nextValues;
      return { ...nextValues };
    },

    setTouched(fieldId, touched = true) {
      state.touched[fieldId] = Boolean(touched);
    },

    setError(fieldId, message) {
      state.errors[fieldId] = message;
    },

    clearErrors() {
      state.errors = {};
    },

    setCurrentReport(report) {
      state.currentReport = report;
    },

    getCurrentReport() {
      return state.currentReport;
    },

    resetValues() {
      for (const fieldId of Object.keys(state.values)) {
        state.values[fieldId] = "";
      }

      for (const inputNode of inputs.values()) {
        inputNode.value = "";
      }
    },
  };
}