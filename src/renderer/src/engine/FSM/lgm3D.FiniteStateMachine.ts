// FiniteStateMachine.ts
import { Game } from "../Game";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import { Rigidbody } from "../physics/lgm3D.Rigidbody";
import { StateFile } from "./IStateFile";
import { FSMVariable, FSMVarType } from "./lgm3D.FSMVariable";
import { State } from "./lgm3D.State";
import { StateRuntimeManager } from "./lgm3D.StateRuntimeManager";

export class FiniteStateMachine extends Component {

    public Variables: Map<string, FSMVariable> = new Map<string, FSMVariable>();
    private _varsByName: Map<string, FSMVariable> = new Map();

    states: Array<State> = new Array<State>();
    fsm: FiniteStateMachine;

    public copyFrom<T extends Component>(componentSource: T): Component {
        throw new Error("Method not implemented.");
    }

    public _currState: State | null = null;
    private nextRequested: string | null = null;

    constructor(
        public readonly name: string,
        public readonly initialId: string,
        gameObject: GameObject,
    ) {
        super(gameObject);
        this.addState("Nouvel Etat");
    }

    // Surchages d'ajout de state
    addState(name: string, statefile?: StateFile): State;
    addState(state: State): State;
    addState(arg1: string | State, statefile?: StateFile): State {
        const s = arg1 instanceof State ? arg1 : new State(arg1, statefile);
        this.states.push(s);
        if (this.states.length == 1) {
            this._currState = s;
        }
        return s;
    }

    addVariable(name: string, type: FSMVarType, initial?: number | string | boolean): FSMVariable {
        const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`); // uid
        const defVal =
            type === 'number' ? Number(initial ?? 0) :
                type === 'boolean' ? Boolean(initial ?? false) :
                    String(initial ?? '');
        const v: FSMVariable = { id, name, type, value: defVal };
        this.Variables.set(id, v);
        this._varsByName.set(name, v);
        return v;
    }

    updateVariable(id: string, patch: Partial<Omit<FSMVariable,'id'>>) {
        const cur = this.Variables.get(id);
        if (!cur) return null;
        // si on change le nom, mettre à jour VariablesByName
        if (patch.name && patch.name !== cur.name) {
            this._varsByName.delete(cur.name);
            this._varsByName.set(patch.name, { ...cur, ...patch });
        }
        const next = { ...cur, ...patch };
        this.Variables.set(id, next);
        return next;
    }

    removeVariable(id: string) {
        const v = this.Variables.get(id);
        if (v) {
            this._varsByName.delete(v.name);
        }
        return this.Variables.delete(id);
    }

    getVar(name: string) {
        return this._varsByName.get(name)?.value;
    }

    public setState(state: State | null): void {
        if (!state) { this._currState = null; return; }
        const running = Game.getInstance().isRunning;
        if (this._currState && running) this._currState.onExit();
        this._currState = state;
        if (running) this._currState.onEnter();
    }

    /** Définit l'état courant sans callbacks (utilisé par l'éditeur / au design-time) */
    public setStateSilently(state: State | null): void {
        this._currState = state;
    }

    private find(id: string) { return this.states.find(s => s.id === id) ?? null; }

    async initialize() {
        console.log("[FSM] init", this.name, "states=", this.states.length);

        await Promise.all(this.states.map(s => StateRuntimeManager.prepare(s.id, s.codeTs)));

        for (const s of this.states) {
            const mod = StateRuntimeManager.getModule(s.id);
            if (!mod) { console.error("[FSM] no module for", s.name); continue; }
            s.bindFromModule(mod, {
                fsm: this,
                requestTransition: id => { this.nextRequested = id; },
                rigidbody: this._gameObject.getComponent?.(Rigidbody)
            });
        }

        // Choix silencieux de l’état initial
        if (!this._currState) {
            const byInitialId = this.states.find(st => st.id === this.initialId) ?? null;
            const fallback = this.states[0] ?? null;
            this.setStateSilently(byInitialId ?? fallback);
        }

        console.log("[FSM] ready. current =", this._currState?.name ?? "(none)");
    }

    private findByKey(key: string) {
        return this.states.find(s =>
            s.id === key || s.name === key || s.stateFile?.clsName === key
        ) ?? null;
    }

    update(dt: number) {
        if (!this._currState || !Game.getInstance().isRunning) return;

        this._currState.onUpdate(dt);

        if (this.nextRequested) {
            const next = this.findByKey(this.nextRequested);
            this.nextRequested = null;
            if (next && next !== this._currState) {
                this._currState.onExit();
                this._currState = next;
                this._currState.onEnter();
            }
        }
    }
}
