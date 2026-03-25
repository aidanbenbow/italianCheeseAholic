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




