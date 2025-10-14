import { TransitionCondition } from "./lgm3D.FiniteStateMachine";

// lgm3D.StateTransition.ts
export class StateTransition {
  public readonly id: string;     // GUID
  public readonly fromId: string;
  public readonly toId: string;
  public cooldownSec: number;     // défaut dépend si self ou pas
  public condition: TransitionCondition = () => false;

  private _lastFiredAtMs = -Infinity;

  constructor(opts: {
    id?: string;
    fromId: string;
    toId: string;
    condition?: TransitionCondition;
    cooldownSec?: number;
  }) {
    this.id = opts.id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`);
    this.fromId = opts.fromId;
    this.toId = opts.toId;

    // si non fourni: self = 0.4s, sinon 0s
    const isSelf = this.fromId === this.toId;
    this.cooldownSec = opts.cooldownSec ?? (isSelf ? 0.4 : 0);
    if (opts.condition) this.condition = opts.condition;
  }

  canFire(nowMs: number) {
    return (nowMs - this._lastFiredAtMs) >= (this.cooldownSec * 1000);
  }
  markFired(nowMs: number) {
    this._lastFiredAtMs = nowMs;
  }
}
