export type FSMVarType = 'number' | 'text' | 'boolean';

export interface FSMVariable {
  id: string;           // uid (clé du dictionnaire)
  name: string;         // (optionnel pour l’affichage/repérage)
  type: FSMVarType;     // "number" | "text" | "boolean"
  value: number | string | boolean;
}