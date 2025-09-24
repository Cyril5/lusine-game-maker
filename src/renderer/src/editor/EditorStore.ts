// EditorStore.ts
import { useSyncExternalStore } from "react";

let state = {
  gameObjects: [] as any[],
  materialIds: [] as number[], // uniqueId des matériaux
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// --- setters ---
export function setGameObjects(next: any[] | ((prev: any[]) => any[])) {
  state = {
    ...state,
    gameObjects: typeof next === "function" ? next(state.gameObjects) : next,
  };
  emit();
}

export function setMaterialIds(next: number[] | ((prev: number[]) => number[])) {
  state = {
    ...state,
    materialIds: typeof next === "function" ? next(state.materialIds) : next,
  };
  emit();
}

// --- hooks ---
export function useGameObjects() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state.gameObjects
  );
}

export function useMaterialIds() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state.materialIds
  );
}
