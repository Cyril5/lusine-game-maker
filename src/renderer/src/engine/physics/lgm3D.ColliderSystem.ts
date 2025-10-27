import { Game } from "../Game";
import { GameObject } from "../GameObject";
import Collider from "./lgm3D.Collider";
import { Rigidbody } from "./lgm3D.Rigidbody";
import * as BABYLON from "@babylonjs/core";

export class ColliderSystem {

  private static collidersByGO = new Map<GameObject, Set<Collider>>();
  private static dirtyGOs = new Set<GameObject>();
  private static _installed = false;

  // Tolérances
  private static readonly EPS_POS = 1e-3;                  // ~1 mm
  private static readonly EPS_SCL = 1e-3;
  private static readonly EPS_ANG = (0.5 * Math.PI) / 180; // 0.5°

  // Caches
  private static _lastParent = new Map<GameObject, BABYLON.Node | null>();
  private static _lastLocal = new Map<GameObject, {
    pos: BABYLON.Vector3, rot: BABYLON.Quaternion, scl: BABYLON.Vector3
  }>();

  // Cooldown anti-spam (Map, pas WeakMap car on l’itère)
  private static _cooldown = new Map<GameObject, number>();
  private static readonly FRAMES_COOLDOWN = 2;

  static registerCollider(c: Collider) {
    const go = c.gameObject;

    if (!this.collidersByGO.has(go)) {
      this.collidersByGO.set(go, new Set());

      const tn = go.transform;

      // NEW: mémoriser le parent courant
      this._lastParent.set(go, tn.parent ?? null);

      tn.onAfterWorldMatrixUpdateObservable.add(() => {
        if (this._hasSignificantLocalDelta(go)) {
          this.markDirty(go);
        }
      });
    }

    this.collidersByGO.get(go)!.add(c);
  }

  static unregisterCollider(c: Collider) {
    const set = this.collidersByGO.get(c.gameObject);
    if (!set) return;
    set.delete(c);
    if (set.size === 0) {
      this.collidersByGO.delete(c.gameObject);
      this._lastParent.delete(c.gameObject); // NEW
    }
  }

  static markDirty(go: GameObject) {
    const left = this._cooldown.get(go) ?? 0;
    if (left > 0) return;                 // encore en cooldown → ignore
    this._cooldown.set(go, this.FRAMES_COOLDOWN);

    this.dirtyGOs.add(go);

    const set = this.collidersByGO.get(go);
    if (set) for (const col of set) col._setDirty?.(true);
  }

  static install(scene: BABYLON.Scene) {
    if (this._installed) return;
    this._installed = true;

    scene.onBeforePhysicsObservable.add(() => this._process(scene));
    scene.onBeforeRenderObservable.add(() => {
      if (!Game.getInstance().isRunning) this._process(scene);
    });
  }

  static markDirtySubtree(root: GameObject) {
    // Marque tous les colliders sous 'root' comme dirty
    for (const go of this.collidersByGO.keys()) {
      let cur: GameObject | undefined = go;
      while (cur) {
        if (cur === root) { this.markDirty(go); break; }
        cur = cur.parent ?? undefined;
      }
    }
  }


  private static _process(_scene: BABYLON.Scene) {

    // En tête de _process(scene)
    if (!_scene.getPhysicsEngine()) {
      this._tickCooldowns();
      return; // on attend que la physique soit activée
    }

    if (this.dirtyGOs.size === 0) {
      this._tickCooldowns();
      return;
    }

    // 1) collecter
    const dirtyCols: Collider[] = [];
    for (const go of this.dirtyGOs) {
      const set = this.collidersByGO.get(go);
      if (set) for (const col of set) dirtyCols.push(col);
    }
    this.dirtyGOs.clear();

    // 2) regrouper par RB
    const perRb = new Map<Rigidbody | undefined, Collider[]>();
    for (const c of dirtyCols) {
      const rb = c.findRigidbody();
      (perRb.get(rb) ?? perRb.set(rb, []).get(rb)!).push(c);
    }

    // 3) rebuild
    for (const [rb, list] of perRb) {
      if (rb) {
        rb.rebuildShapes(() => {
          for (const col of list) {
            col._setDirty?.(true);
            col.buildShapeIntoBody(rb);
          }
        });
      } else {
        for (const col of list) {
          col._setDirty?.(true);
          col.buildStatic();
        }
      }
    }

    this._tickCooldowns();
  }

  private static _tickCooldowns() {
    for (const [go, left] of this._cooldown) {
      if (left <= 1) this._cooldown.delete(go);
      else this._cooldown.set(go, left - 1);
    }
  }

  // --- Delta LOCAL robuste : gère rotationQuaternion *ou* rotation Euler ---
  private static _hasSignificantLocalDelta(go: GameObject): boolean {
    const t = go.transform;

    // NEW: détection d’un changement de parent
    const parentNow = t.parent ?? null;
    const parentLast = this._lastParent.get(go);
    if (parentLast !== parentNow) {
      this._lastParent.set(go, parentNow);
      return true; // parent différent → rebuild requis
    }

    // ... puis tes tests pos/rot/scale existants
    const pos = t.position?.clone() ?? BABYLON.Vector3.Zero();
    const scl = t.scaling?.clone() ?? BABYLON.Vector3.One();
    const rot = t.rotationQuaternion
      ? t.rotationQuaternion.clone()
      : BABYLON.Quaternion.FromEulerVector((t as any).rotation ?? BABYLON.Vector3.Zero());

    const last = this._lastLocal.get(go);
    this._lastLocal.set(go, { pos: pos.clone(), rot: rot.clone(), scl: scl.clone() });
    if (!last) return true;

    if (BABYLON.Vector3.Distance(last.pos, pos) > this.EPS_POS) return true;
    if (Math.abs(last.scl.x - scl.x) > this.EPS_SCL ||
      Math.abs(last.scl.y - scl.y) > this.EPS_SCL ||
      Math.abs(last.scl.z - scl.z) > this.EPS_SCL) return true;

    const dot = Math.min(1, Math.max(-1, BABYLON.Quaternion.Dot(last.rot, rot)));
    const ang = 2 * Math.acos(Math.abs(dot));
    return ang > this.EPS_ANG;
  }
}

export default ColliderSystem;