
import { h } from "../../engine/core/h.js";
import { HomePage } from "./pages/HomePage.js";

export function mount(engine) {
  console.log("Blog app mounted");

  
  // Render the page
  engine.ui.render(h(HomePage, {}));
}


