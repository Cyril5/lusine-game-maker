import ShortUniqueId from "short-unique-id";
import { IStateFile } from "./IStateFile";
import { FiniteStateMachine } from "./lgm3D.FiniteStateMachine";
import { createRuntimeApi, FsmApi } from "./lgm3D.FSMRuntimeAPI";

function toValidClassName(src: string, fallback = "State") {
    const base = (src ?? "").trim();
    const cleaned = base.replace(/[^a-zA-Z0-9_]/g, "_");
    const headOk = /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
    return headOk || fallback;
}

export class State {
    public instance: any = null;
    name: string = "State";
    fsm?: FiniteStateMachine; // fsm owner
    stateFile?: IStateFile;
    readonly id: string;

    constructor(name: string, stateFile: IStateFile | undefined) {
        this.name = name;
        if (stateFile) {
            this.stateFile = stateFile;
        }
        const uid = new ShortUniqueId({ length: 6 });
        // id stable si filename défini, sinon unique
        this.id = this.stateFile?.filename ?? `${this.name}#${uid.rnd()}`;
    }

    // 👉 Le code TS vient du fichier d'état
    get codeTs(): string {
        const code = this.stateFile?.outputCode?.trim();
        if (code) return code;

        const cls = toValidClassName(this.stateFile?.clsName ?? this.name ?? "State");

        return `
        import type { FsmApi } from "@/engine/lgm3D.FSMRuntimeAPI";
        export default class ${cls} implements Partial<FsmApi> {
        console!: FsmApi["console"];
        requestTransition!: FsmApi["requestTransition"];
        rigidbody?: FsmApi["rigidbody"];
        onEnter(){} onUpdate(_dt:number){} onExit(){}
        }
        `.trim();
    }

    bindFromModule(
        mod: any,
        ctx: { requestTransition: (id: string) => void; rigidbody?: FsmApi["rigidbody"] }
    ) {
        const api = createRuntimeApi(ctx);
        const inst = new mod.default(api);
        Object.assign(inst, api); // permet this.rigidbody / this.requestTransition / this.console
        this.instance = inst as FsmApi & typeof inst;
    }

    onEnter() { try { this.instance?.onEnter?.(); } catch (e) { console.error(e); } }
    onUpdate(dt: number) { try { this.instance?.onUpdate?.(dt); } catch (e) { console.error(e); } }
    onExit() { try { this.instance?.onExit?.(); } catch (e) { console.error(e); } }
}
