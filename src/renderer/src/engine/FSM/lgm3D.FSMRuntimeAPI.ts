import { FiniteStateMachine } from "./lgm3D.FiniteStateMachine";

export interface Rigidbody {
  setVelocity(v: {x:number;y:number;z:number}): void;
  addForce(v: {x:number;y:number;z:number}): void;
  getVelocity?(): {x:number;y:number;z:number};
}

export interface FsmApi {
  console: { log: (...a:any[])=>void; warn: (...a:any[])=>void; error: (...a:any[])=>void };
  requestTransition: (nextId: string) => void;
  rigidbody?: Rigidbody;
}

export function createRuntimeApi(ctx: {
  fsm: FiniteStateMachine;
  requestTransition: (id: string) => void;
  rigidbody?: Rigidbody;
}): FsmApi {
  return {
    console: {
      log:  (...a)=>console.log(`[FSM:${ctx.fsm.name}]`, ...a),
      warn: (...a)=>console.warn(`[FSM:${ctx.fsm.name}]`, ...a),
      error:(...a)=>console.error(`[FSM:${ctx.fsm.name}]`, ...a),
    },
    requestTransition: ctx.requestTransition,
    rigidbody: ctx.rigidbody,
  };
}