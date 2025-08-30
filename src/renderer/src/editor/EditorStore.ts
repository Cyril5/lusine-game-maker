import { useSyncExternalStore } from "react";

// état global interne (pas un useState)
let state: any[] = []; // ton tableau de nodes
let listeners = new Set<() => void>();

// setter global : change le state + notifie tous les abonnés
export function setGameObjects(newState: any[]) {
  state = newState;
  listeners.forEach(l => l()); // déclenche un re-render dans tous les composants abonnés
}

// hook React pour consommer ce state
export function useGameObjects() {
  return useSyncExternalStore(
    // fonction de souscription : comment s’abonner aux changements
    (listener) => {
      listeners.add(listener);               // on stocke le listener
      return () => listeners.delete(listener); // fonction de cleanup
    },
    // fonction de lecture du snapshot : comment récupérer l’état actuel
    () => state
  );
}