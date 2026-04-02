D:\italianCheeseAholic\server\server.js

registerStatic(app);

D:\italianCheeseAholic\client\src\index.js
bootstrapLauncher();

D:\italianCheeseAholic\client\src\engine\core\Engine.js
engine.start();

D:\italianCheeseAholic\client\src\engine\core\BaseEngine.js
this.mount();

 this.attachModules(this.lifecycleModules);

module?.attach?.();

 this.modules = [
      this.appLoader,
      this.commands,
      this.sceneGraph,
      this.ui
    ];

engine.start()
 → mount()
 → attach lifecycle modules
 → emit "engine:started"
 → bootstrap loads first app
 → app.mount(engine)
 → UI renders

 Signals → Effects → SceneNodes → Dirty Pipeline

## Engine module authoring guide

### Why

- Keep `Engine` pure and deterministic.
- Keep modules decoupled from each other.
- Keep `engine.context` stable and discoverable.

### Module contract

Each module should expose only what other modules/apps need via `contextExports()`.

```js
export class SomeModule {
  constructor(engine) {
    this.engine = engine;
  }

  contextExports() {
    return {
      someService: this
    };
  }

  attach() {}
  detach() {}
}
```

The engine automatically registers each module and merges its exports into `engine.context`.

### Should there be a BaseModule class?

Yes — as a lightweight optional foundation.

- Useful for shared ergonomics (`this.context`, `this.emit`, consistent `id`).
- Prevents repeated boilerplate in each module.
- Should stay minimal and unopinionated so modules remain flexible.

Base class location: [client/src/engine/modules/BaseModule.js](client/src/engine/modules/BaseModule.js)

```js
import { BaseModule } from "./BaseModule.js";

export class InputModule extends BaseModule {
  constructor(engine) {
    super(engine);
  }
}
```

At the core is a TextEditingSystem module that orchestrates:
- Model: TextModel (pure text buffer)
- State controllers: CaretController, SelectionController
- Input controllers: KeyboardInputController, PointerSelectionController, ClipboardController
- UI helpers: OverlayRenderer, SelectionMenu, PastePrompt
- Layout helpers: TextLayoutUtils, CaretHitTestUtils
- Scene integration: InputNode + InputBehavior + TextComponent
Everything else plugs into this.
High‑level flow
Start editing
- User clicks/taps an InputNode.
- InputNode.onPointerDown:
- requestFocus()
- requestEdit()
- TextEditingSystem.startEditing(node):
- activeNode = node
- model.setText(node.getValue())
- caret.moveToEnd()
- selection.clear()
- keyboard.enable()
- invalidate()
Typing
- KeyboardInputController receives input / keydown.
- For characters:
- system.insertText(text):
- uses TextModel to compute new text + caret
- applyTextChange(newText):
- activeNode.setValue(newText)
- activeNode.requestLayout()
- invalidate()
- For backspace/delete:
- system.backspace() / deleteForward():
- uses TextModel + selection
- updates caret + selection
Pointer selection
- PointerSelectionController receives pointer events.
- On down:
- hit‑test → caret index
- caret.setIndex(index)
- selection.begin(index)
- On move:
- hit‑test → new index
- selection.extendTo(index)
- caret.setIndex(index)
- On up:
- if selection.hasRange() → SelectionMenu.showForSelection()
Clipboard
- SelectionMenu or keyboard shortcuts call:
- clipboard.copy()
- clipboard.cut()
- clipboard.paste()
- ClipboardController uses SelectionController + TextModel + PastePrompt.
Rendering
- RenderPipeline calls:
- InputBehavior.render() for the node
- OverlayRenderer.render() as overlay:
- drawSelection()
- drawCaret()

## Responsive node sizing

Node and behavior measurement now supports screen-adaptive dimensions through layout constraints.

### Supported style values

- Number: `width: 320`
- Percent of parent constraints: `width: "80%"`
- Viewport-relative units: `width: "90vw"`, `height: "60vh"`
- Function-based value: `width: ({ constraints }) => constraints.maxWidth < 768 ? 320 : 520`

You can use the same value types for:

- `width`, `height`
- `minWidth`, `maxWidth`
- `minHeight`, `maxHeight`

### Where this works

- Base fallback measurement in [client/src/engine/nodes/sceneNode.js](client/src/engine/nodes/sceneNode.js)
- Behaviors:
  - [client/src/engine/nodes/behaviours/boxBehaviour.js](client/src/engine/nodes/behaviours/boxBehaviour.js)
  - [client/src/engine/nodes/behaviours/textBehaviour.js](client/src/engine/nodes/behaviours/textBehaviour.js)
  - [client/src/engine/nodes/behaviours/buttonBehaviour.js](client/src/engine/nodes/behaviours/buttonBehaviour.js)
  - [client/src/engine/nodes/behaviours/inputBehaviour.js](client/src/engine/nodes/behaviours/inputBehaviour.js)
  - [client/src/engine/nodes/behaviours/verticalBehaviour.js](client/src/engine/nodes/behaviours/verticalBehaviour.js)
  - [client/src/engine/nodes/behaviours/scrollableBehaviour.js](client/src/engine/nodes/behaviours/scrollableBehaviour.js)
  - [client/src/engine/nodes/behaviours/overlayLayerBehaviour.js](client/src/engine/nodes/behaviours/overlayLayerBehaviour.js)

### Example

```js
const cardStyle = {
  width: "90%",
  maxWidth: 640,
  minWidth: 280,
  height: ({ constraints }) => constraints.maxWidth < 768 ? 180 : 240,
  minHeight: 140
};
```

### Notes

- Percent and `vw`/`vh` resolve against the current render/layout constraints.
- If a behavior provides custom `measure`, it must use the shared resolvers to remain responsive.
- Changing any of these style keys at runtime triggers layout recalculation.




