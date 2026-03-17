
import { h } from "../../engine/core/h.js";
import { HomePage } from "./pages/HomePage.js";

// export function mount(engine) {
//   console.log("Blog app mounted");

  
//   // Render the page
//   engine.ui.render(h(HomePage, {}));
// }
// In any app
export function mount(engine) {
  // These now appear on the system canvas layer (on top)
  engine.systemUI.toastLayer.show("Welcome!");
  engine.systemUI.popupLayer.show("intro", "Get started");
}


