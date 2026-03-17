// System UI Usage Examples
// See: engine.systemUI for access to popup, toast, dropdown, keyboard layers

// In any app or module, you can access system UI via the engine:

// ============================================================
// POPUPS / MODALS
// ============================================================
export function examplePopupUsage(engine) {
  // Show a popup
  engine.systemUI.popupLayer.show("confirm-dialog", "Are you sure?", {
    style: {
      width: 300,
      height: 150
    }
  });

  // Hide a popup
  setTimeout(() => {
    engine.systemUI.popupLayer.hide("confirm-dialog");
  }, 2000);
}

// ============================================================
// TOASTS (Notifications)
// ============================================================
export function exampleToastUsage(engine) {
  // Show a toast that auto-dismisses after 3 seconds
  const toastId = engine.systemUI.toastLayer.show("Operation completed!", {
    duration: 3000,
    style: {
      background: "#4CAF50",
      color: "white"
    }
  });

  // Or manually hide it
  // engine.systemUI.toastLayer.hide(toastId);
}

// ============================================================
// DROPDOWNS / MENUS
// ============================================================
export function exampleDropdownUsage(engine) {
  const items = [
    { label: "Edit", action: "edit" },
    { label: "Delete", action: "delete" },
    { label: "Share", action: "share" }
  ];

  const position = { x: 100, y: 100 };

  engine.systemUI.dropDownLayer.show("context-menu", items, position, {
    style: {
      width: 150,
      background: "#fff"
    }
  });

  // Hide all dropdowns
  setTimeout(() => {
    engine.systemUI.dropDownLayer.hideAll();
  }, 5000);
}

// ============================================================
// KEYBOARD LAYER
// ============================================================
export function exampleKeyboardUsage(engine) {
  // Listen to keyboard events via engine events
  engine.on("keyboard:keydown", ({ key, code }) => {
    console.log(`Key pressed: ${key}`);
  });

  engine.on("keyboard:keyup", ({ key, code }) => {
    console.log(`Key released: ${key}`);
  });

  // Show/hide keyboard UI if needed
  engine.systemUI.keyboardLayer.show();
  engine.systemUI.keyboardLayer.hide();
}

// ============================================================
// ACCESSING ALL SYSTEM UI SERVICES
// ============================================================
export function exampleAccessAllServices(engine) {
  const services = engine.systemUI.getServices();

  // services.popups
  // services.keyboard
  // services.toasts
  // services.dropdowns
}
