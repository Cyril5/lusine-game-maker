// FiniteStateMachine.ts
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import { Rigidbody } from "../physics/lgm3D.Rigidbody";
import { IStateFile } from "./IStateFile";
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
    addState(name: string, statefile?: IStateFile): State;
    addState(state: State): State;
    addState(arg1: string | State, statefile?: IStateFile): State {
        const s = arg1 instanceof State ? arg1 : new State(arg1, statefile);
        this.states.push(s);
        return s;
    }

    setState(state: State | null): void {
        if (!state) {
            this._currState = null;
            return;
        }
        if (this._currState)
            this._currState.onExit();
        this._currState = state;
        console.log(this._currState.onEnter);
        this._currState.onEnter();
    }

    private find(id: string) { return this.states.find(s => s.id === id) ?? null; }

    async initialize() {
        // compile tous les states via StateRuntimeManager.prepare(id, codeTs) puis bindFromModule(...).
        await Promise.all(this.states.map(s => StateRuntimeManager.prepare(s.id, s.codeTs)));
        for (const s of this.states) {
            const mod = StateRuntimeManager.getModule(s.id)!;
            s.bindFromModule(mod, {
                requestTransition: (id) => { this.nextRequested = id; },
                rigidbody: this._gameObject.getComponent(Rigidbody),
            });
        }
        this._currState = this.states.find(st => st.id === this.initialId) ?? this.states[0] ?? null;
        this._currState?.onEnter();
    }

    update(dt: number) {
        if (!this._currState) return;
        this._currState.onUpdate(dt);

        if (this.nextRequested) {
            const next = this.find(this.nextRequested);
            this.nextRequested = null;
            if (next && next !== this._currState) {
                this._currState.onExit();
                this._currState = next;
                this._currState.onEnter();
            }
        }
    }
}
