let activeEffect = null;
let isFlushing = false;
let batchDepth = 0;
const effectQueue = new Set();

class ReactiveEffect {
  constructor(runFn) {
    this.runFn = runFn;
    this.active = true;
    this.deps = new Set();
    this.cleanups = [];
  }

  run() {
    if (!this.active) return;

    this.cleanup();

    const previous = activeEffect;
    activeEffect = this;

    try {
      this.runFn((cleanupFn) => {
        if (typeof cleanupFn === "function") {
          this.cleanups.push(cleanupFn);
        }
      });
    } finally {
      activeEffect = previous;
    }
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.cleanup();
  }

  cleanup() {
    for (const dep of this.deps) {
      dep.subscribers.delete(this);
    }
    this.deps.clear();

    while (this.cleanups.length > 0) {
      const cleanupFn = this.cleanups.pop();
      try {
        cleanupFn?.();
      } catch (error) {
        console.error("reactive: cleanup failed", error);
      }
    }
  }
}

class SignalImpl {
  constructor(initialValue) {
    this._value = initialValue;
    this.subscribers = new Set();
  }

  get value() {
    if (activeEffect) {
      this.subscribers.add(activeEffect);
      activeEffect.deps.add(this);
    }
    return this._value;
  }

  set value(nextValue) {
    if (Object.is(this._value, nextValue)) {
      return;
    }
    this._value = nextValue;
    this.notify();
  }

  peek() {
    return this._value;
  }

  set(nextValue) {
    this.value = nextValue;
  }

  update(updater) {
    this.value = updater(this._value);
  }

  notify() {
    for (const subscriber of this.subscribers) {
      queueEffect(subscriber);
    }
  }
}

export function signal(initialValue) {
  return new SignalImpl(initialValue);
}

export function effect(runFn) {
  const reactiveEffect = new ReactiveEffect(runFn);
  reactiveEffect.run();

  return () => {
    reactiveEffect.stop();
  };
}

export function computed(getter) {
  const target = signal(undefined);

  const stop = effect(() => {
    target.value = getter();
  });

  return {
    get value() {
      return target.value;
    },
    peek() {
      return target.peek();
    },
    stop
  };
}

export function batch(runFn) {
  batchDepth += 1;
  try {
    return runFn();
  } finally {
    batchDepth -= 1;
    if (batchDepth === 0) {
      scheduleFlush();
    }
  }
}

function queueEffect(reactiveEffect) {
  if (!reactiveEffect?.active) return;
  effectQueue.add(reactiveEffect);

  if (batchDepth > 0) {
    return;
  }

  scheduleFlush();
}

function scheduleFlush() {
  if (isFlushing) {
    return;
  }

  isFlushing = true;
  queueMicrotask(flushEffects);
}

function flushEffects() {
  try {
    let guard = 0;

    while (effectQueue.size > 0) {
      if (guard++ > 1000) {
        console.warn("reactive: flush guard hit (possible cyclical effect)");
        effectQueue.clear();
        break;
      }

      const pending = Array.from(effectQueue);
      effectQueue.clear();

      for (const effectToRun of pending) {
        effectToRun.run();
      }
    }
  } finally {
    isFlushing = false;
  }
}
