export interface Store<T> {
  getSnapshot(): T;
  set(updater: T | ((current: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    set(updater) {
      state = typeof updater === "function" ? (updater as (current: T) => T)(state) : updater;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}