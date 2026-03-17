/**
 * @deprecated UIEngine is no longer used.
 * 
 * The application architecture now uses a single Engine with modular components:
 * - Engine (main orchestrator)
 *   ├── SceneGraphModule (manages scene tree)
 *   ├── UIModule (VNode reconciliation & rendering)
 *   ├── SystemUIModule (popups, toasts, dropdowns, keyboard)
 *   └── ... other modules
 * 
 * System UI layers are now handled by SystemUIModule which automatically:
 * - Creates popup, toast, keyboard, and dropdown layers as SceneNode children
 * - Attaches them to the root scene graph
 * - Provides services via engine.systemUI.getServices()
 * 
 * If you need system UI features, access them via:
 *   engine.systemUI.popupLayer.show(...)
 *   engine.systemUI.toastLayer.show(...)
 *   engine.systemUI.dropDownLayer.show(...)
 *   engine.systemUI.keyboardLayer.show(...)
 */