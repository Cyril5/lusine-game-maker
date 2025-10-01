// FiniteStateMachine.ts
import { Game } from "../Game";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import { Rigidbody } from "../physics/lgm3D.Rigidbody";
import { StateFile } from "./IStateFile";
import { State } from "./lgm3D.State";
import { StateRuntimeManager } from "./lgm3D.StateRuntimeManager";

export class FiniteStateMachine extends Component {
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
