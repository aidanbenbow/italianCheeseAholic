import { BaseModule } from "./BaseModule.js";

export class LoggerModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.entries = [];
    this.maxEntries = 250;
    this.unsubscribers = [];
    this.commandNames = new Set();
  }

  contextExports() {
    return {
      logger: this
    };
  }

  attach() {
    const eventNames = [
      "engine:started",
      "launcher:manifestLoaded",
      "launcher:appLaunched",
      "app:loaded",
      "app:error",
      "command:executed",
      "command:error",
      "command:missing",
      "focus:changed",
      "input:scene-event"
    ];

    for (const eventName of eventNames) {
      const off = this.engine.on(eventName, payload => {
        this.record(eventName, payload);
      });
      this.unsubscribers.push(off);
    }

    const offStartupSummary = this.engine.on("engine:started", () => {
      if (this.engine.context.debugFlags?.logUiOnStart !== true) return;

      const summary = this.getUiSummary();
      this.record("ui:startup-summary", summary);
      console.log("UI startup summary", summary);
    });
    this.unsubscribers.push(offStartupSummary);

    this._registerDebugCommands();
  }

  detach() {
    while (this.unsubscribers.length) {
      const off = this.unsubscribers.pop();
      off?.();
    }

    const commands = this.engine.context.commands;
    if (commands) {
      for (const commandName of this.commandNames) {
        commands.unregister(commandName);
      }
    }

    this.commandNames.clear();
  }

  record(eventName, payload) {
    const entry = {
      timestamp: new Date().toISOString(),
      event: eventName,
      payload: this._sanitize(payload)
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    if (this._consoleEnabled()) {
      console.info(`[engine:${eventName}]`, entry.payload);
    }

    return entry;
  }

  getEntries({ limit = 50 } = {}) {
    const size = Math.max(1, Math.min(limit, this.entries.length));
    return this.entries.slice(-size);
  }

  getSystemSnapshot() {
    const context = this.engine.context;
    const renderPipelines = context.renderPipelines ?? {};

    return {
      activeApp: context.activeApp ? "loaded" : "none",
      selectionId: context.selection?.id ?? null,
      focusId: context.focus?.id ?? null,
      modules: Object.keys(context.modules ?? {}),
      pipelines: Object.fromEntries(
        Object.entries(renderPipelines).map(([name, pipeline]) => [
          name,
          {
            running: Boolean(pipeline?.running),
            hasRoot: Boolean(pipeline?.root)
          }
        ])
      ),
      uiSummary: this.getUiSummary(),
      inputPipeline: context.input?.pipeline?.debugSnapshot?.() ?? []
    };
  }

  getUiSummary() {
    const uiRoot = this.engine.context.ui?.rootNode ?? null;
    const systemRoot = this.engine.context.systemUI?.root ?? null;

    return {
      ui: {
        rootId: uiRoot?.id ?? null,
        childCount: uiRoot?.children?.length ?? 0,
        bounds: uiRoot?.bounds ?? null
      },
      systemUI: {
        rootId: systemRoot?.id ?? null,
        childCount: systemRoot?.children?.length ?? 0,
        bounds: systemRoot?.bounds ?? null,
        services: {
          popups: Boolean(this.engine.context.systemUI?.popupLayer),
          keyboard: Boolean(this.engine.context.systemUI?.keyboardLayer),
          toasts: Boolean(this.engine.context.systemUI?.toastLayer),
          dropdowns: Boolean(this.engine.context.systemUI?.dropDownLayer)
        }
      }
    };
  }

  getUiTree({ includeSystemUI = true, maxDepth = 6, maxNodes = 500 } = {}) {
    const state = {
      count: 0,
      truncated: false,
      maxDepth,
      maxNodes
    };

    return {
      uiRoot: this._serializeNode(this.engine.context.ui?.rootNode ?? null, 0, state),
      systemUiRoot: includeSystemUI
        ? this._serializeNode(this.engine.context.systemUI?.root ?? null, 0, state)
        : null,
      truncated: state.truncated,
      nodeCount: state.count,
      limits: {
        maxDepth,
        maxNodes
      }
    };
  }

  _registerDebugCommands() {
    const commands = this.engine.context.commands;
    if (!commands || !this._isDevMode()) return;

    const add = (name, handler) => {
      commands.register(name, handler);
      this.commandNames.add(name);
    };

    add("debug:systemSnapshot", () => {
      const snapshot = this.getSystemSnapshot();
      console.log("System snapshot", snapshot);
      return snapshot;
    });

    add("debug:logs", ({ limit = 30 } = {}) => {
      const logs = this.getEntries({ limit });
      console.table(logs.map(log => ({ timestamp: log.timestamp, event: log.event })));
      return logs;
    });

    add("debug:uiTree", ({ includeSystemUI = true, maxDepth = 6, maxNodes = 500 } = {}) => {
      const tree = this.getUiTree({ includeSystemUI, maxDepth, maxNodes });
      console.log("UI tree", tree);
      return tree;
    });
  }

  _serializeNode(node, depth, state) {
    if (!node) return null;

    if (state.count >= state.maxNodes) {
      state.truncated = true;
      return {
        id: node.id ?? null,
        truncated: true,
        reason: "maxNodes"
      };
    }

    state.count += 1;

    const base = {
      id: node.id ?? null,
      type: node.type ?? null,
      behavior: node.behavior?.constructor?.name ?? null,
      visible: Boolean(node.visible),
      bounds: node.bounds
        ? {
            x: node.bounds.x,
            y: node.bounds.y,
            width: node.bounds.width,
            height: node.bounds.height
          }
        : null,
      childCount: node.children?.length ?? 0
    };

    if (depth >= state.maxDepth) {
      if ((node.children?.length ?? 0) > 0) {
        state.truncated = true;
      }

      return {
        ...base,
        children: [],
        truncated: true,
        reason: "maxDepth"
      };
    }

    return {
      ...base,
      children: (node.children ?? []).map(child => this._serializeNode(child, depth + 1, state))
    };
  }

  _consoleEnabled() {
    if (this.engine.context.debugFlags?.loggerConsole === true) return true;
    return this._isDevMode();
  }

  _isDevMode() {
    const host = globalThis?.location?.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }

  _sanitize(payload) {
    if (!payload || typeof payload !== "object") return payload;

    const maxDepth = 2;
    const seen = new WeakSet();

    const walk = (value, depth) => {
      if (value == null || typeof value !== "object") return value;
      if (seen.has(value)) return "[Circular]";
      if (depth >= maxDepth) return `[${value.constructor?.name || "Object"}]`;

      seen.add(value);

      if (Array.isArray(value)) {
        return value.slice(0, 8).map(item => walk(item, depth + 1));
      }

      const result = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        if (key === "originalEvent") {
          result[key] = nestedValue?.type || "[Event]";
          continue;
        }

        if (key === "target" || key === "currentTarget") {
          result[`${key}Id`] = nestedValue?.id ?? null;
          continue;
        }

        result[key] = walk(nestedValue, depth + 1);
      }

      return result;
    };

    return walk(payload, 0);
  }
}
