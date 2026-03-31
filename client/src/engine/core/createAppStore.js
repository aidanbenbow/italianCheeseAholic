import { batch, signal } from "./reactive.js";

export function createAppStore(initialState = {}) {
  const state = {};

  for (const [key, value] of Object.entries(initialState)) {
    state[key] = signal(value);
  }

  function set(patch) {
    if (!patch || typeof patch !== "object") return;

    batch(() => {
      for (const [key, value] of Object.entries(patch)) {
        if (!(key in state)) {
          state[key] = signal(value);
          continue;
        }
        state[key].value = value;
      }
    });
  }

  function update(key, updater) {
    const current = state[key];
    if (!current || typeof updater !== "function") return;
    current.value = updater(current.value);
  }

  function snapshot() {
    const output = {};
    for (const [key, sig] of Object.entries(state)) {
      output[key] = sig.value;
    }
    return output;
  }

  function action(runFn) {
    if (typeof runFn !== "function") {
      throw new Error("createAppStore.action(runFn): runFn must be a function");
    }

    return async (...args) => {
      return runFn(
        {
          state,
          set,
          update,
          snapshot
        },
        ...args
      );
    };
  }

  return {
    state,
    set,
    update,
    snapshot,
    action
  };
}