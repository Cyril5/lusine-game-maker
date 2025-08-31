import { useSyncExternalStore } from "react";

let state: any[] = [];
let listeners = new Set<() => void>();

export function setGameObjects(
  next: any[] | ((prev: any[]) => any[])
) {
  state = typeof next === "function" ? (next as (p: any[]) => any[])(state) : next;
  listeners.forEach(l => l());
}

export function useGameObjects() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state
  );
}