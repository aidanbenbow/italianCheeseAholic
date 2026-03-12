export function attachModules(modules = []) {
  for (const module of modules) {
    module?.attach?.();
  }
}

export function detachModules(modules = []) {
  for (let index = modules.length - 1; index >= 0; index -= 1) {
    modules[index]?.detach?.();
  }
}
