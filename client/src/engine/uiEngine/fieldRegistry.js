/**
 * fieldRegistry.js
 *
 * Central registry for field-type dispatch across the form system.
 *
 * Three concerns unified here:
 *   1. Field compilers   — how to render a DSL field node into scene nodes
 *   2. Validatable types — which schema field types can carry validation rules
 *   3. Schema-type map   — which DSL control name maps to a given schema type
 *
 * Custom field types can be registered at app boot time by calling
 * registerFieldCompiler, registerValidatableType, and registerSchemaTypeMapping.
 */

// ---------------------------------------------------------------------------
// 1. Field compilers
// ---------------------------------------------------------------------------

/** @type {Record<string, (engine: any, child: any, ctx: FieldCompilerContext) => void>} */
const fieldCompilers = {};

/**
 * @typedef {Object} FieldCompilerContext
 * @property {any}     page                 - The parent scrollable page node
 * @property {any}     refs                 - The live refs object (inputs, fields, …)
 * @property {any}     dsl                  - The root form DSL node
 * @property {any}     resolvedFormInstance - The active FormInstance
 * @property {Array}   inputDisposers       - Array to push cleanup functions into
 */

/**
 * Register a renderer for a DSL field control type.
 * @param {string}   controlName - e.g. "input", "textarea", "text", "select"
 * @param {function} fn          - (engine, child, ctx: FieldCompilerContext) => void
 */
export function registerFieldCompiler(controlName, fn) {
  fieldCompilers[controlName] = fn;
}

/**
 * Dispatch field rendering to the registered compiler for child.control.
 * Logs a warning and skips if no compiler is registered.
 */
export function compileField(engine, child, ctx) {
  const compiler = fieldCompilers[child.control];
  if (!compiler) {
    console.warn(`[fieldRegistry] No compiler registered for control "${child.control}" — skipping field "${child.id}".`);
    return;
  }
  compiler(engine, child, ctx);
}

// ---------------------------------------------------------------------------
// 2. Validatable types
// ---------------------------------------------------------------------------

/** @type {Set<string>} Schema field types whose values should be validated */
const validatableTypes = new Set();

/**
 * Mark one or more schema field types as accepting validation rules.
 * @param {...string} types
 */
export function registerValidatableType(...types) {
  for (const t of types) validatableTypes.add(t);
}

/**
 * Returns true if the given schema field type participates in form validation.
 * @param {string} type
 * @returns {boolean}
 */
export function isValidatableFieldType(type) {
  return validatableTypes.has(type);
}

// ---------------------------------------------------------------------------
// 3. Schema-type → DSL control mapping
// ---------------------------------------------------------------------------

/** @type {Record<string, string>} Maps JSON-schema field types to DSL control names */
const schemaTypeToControl = {};

/**
 * Register a mapping from a JSON-schema field type to a DSL control name.
 * @param {string} schemaType  - e.g. "text", "textarea", "select"
 * @param {string} controlName - e.g. "input", "textarea", "select"
 */
export function registerSchemaTypeMapping(schemaType, controlName) {
  schemaTypeToControl[schemaType] = controlName;
}

/**
 * Resolve the DSL control name for a given JSON-schema field type.
 * Falls back to "input" if no explicit mapping is registered.
 * @param {string} type
 * @returns {string}
 */
export function getControlForSchemaType(type) {
  return schemaTypeToControl[type] ?? "input";
}

// ---------------------------------------------------------------------------
// Default registrations
// ---------------------------------------------------------------------------

// --- Validatable types ---
registerValidatableType("input", "textarea");

// --- Schema-type → control mappings ---
registerSchemaTypeMapping("text",     "text");
registerSchemaTypeMapping("input",    "input");
registerSchemaTypeMapping("textarea", "textarea");

// --- Field compilers ---

/** Static label / read-only text */
registerFieldCompiler("text", (engine, child, { page, refs }) => {
  const textNode = engine.ui.createTextNode({
    id: child.id,
    style: child.textStyle ?? {},
  });
  textNode.text = child.text ?? "";
  refs.fields.set(child.id, child);
  engine.ui.mountNode(textNode, page);
});

/**
 * Shared implementation for any editable text control (input / textarea).
 * The DSL child drives multiline / autoGrow so no branching is needed here.
 */
function compileEditableField(engine, child, { page, refs, dsl, resolvedFormInstance, inputDisposers }) {
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
}

registerFieldCompiler("input",    compileEditableField);
registerFieldCompiler("textarea", compileEditableField);
