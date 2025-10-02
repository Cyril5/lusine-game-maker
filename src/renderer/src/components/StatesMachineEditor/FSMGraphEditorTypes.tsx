import { StateFile } from "@renderer/engine/FSM/IStateFile";

// types.ts
export type NodeVM = { 
    id: string; 
    name: string; 
    x: number; y: number; 
    isSub?: boolean; 
    subId?: string;
    stateFile?: StateFile;
};
export type EdgeVM = { id: string; from: string; to: string; event?: string; priority?: number };

// Miroir minimal de ta FSM
// export type LgmState = { id: string; ui?: { x: number; y: number } };
// export type LgmFiniteStateMachine = { states: LgmState[] };
