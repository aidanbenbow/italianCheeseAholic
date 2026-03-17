// SceneEventDispatcher.js
import { buildScenePath } from "./sceneEvent.js";

export class SceneEventDispatcher {
  dispatch(event) {
    if (!event?.target) return false;

    const path = buildScenePath(event.target);

    // -------------------------------------------------------
    // CAPTURE PHASE (root → parent of target)
    // -------------------------------------------------------
    event.phase = "capture";
    for (let i = 0; i < path.length - 1; i++) {
      const node = path[i];
      event.currentTarget = node;

      if (node.onEventCapture?.(event)) return true;
      if (event.propagationStopped) return true;
    }

    // -------------------------------------------------------
    // TARGET PHASE
    // -------------------------------------------------------
    const target = event.target;
    event.phase = "target";
    event.currentTarget = target;

    if (target.onEvent?.(event)) return true;
    if (event.propagationStopped) return true;

    // -------------------------------------------------------
    // BUBBLE PHASE (parent of target → root)
    // -------------------------------------------------------
    event.phase = "bubble";
    for (let i = path.length - 2; i >= 0; i--) {
      const node = path[i];
      event.currentTarget = node;

      if (node.onEventBubble?.(event)) return true;
      if (event.propagationStopped) return true;
    }

    return false;
  }
}