import { Game } from "../Game";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import ColliderSystem from "./lgm3D.ColliderSystem";
import { Rigidbody } from "./lgm3D.Rigidbody";
import * as BABYLON from "@babylonjs/core";

export default abstract class Collider extends Component {
    
  protected _scene: BABYLON.Scene;
  protected _editorGizmo?: BABYLON.AbstractMesh;     // maillage proxy (wireframe) pour l’éditeur
  protected _physicsBody?: BABYLON.PhysicsBody;      // seulement en Play
  protected _physicsShape?: BABYLON.PhysicsShape;    // seulement en Play
  protected _dirty = true;
  protected _isTrigger = false;

  get isTrigger() { return this._isTrigger; }
  set isTrigger(v: boolean) {
    this._isTrigger = v;
    // En Play uniquement : propager sur la shape
    if (this._physicsShape) (this._physicsShape as any).isTrigger = v;
  }

  constructor(owner: GameObject) {
    super(owner);
    this._scene = owner.scene;

    // Enregistrer ce collider côté système (rebuilds centralisés)
    ColliderSystem.registerCollider(this);
    ColliderSystem.install(this._scene);
    ColliderSystem.markDirty(this._gameObject);

    // Abonnements jeu : activer/désactiver uniquement pendant le Play
    Game.getInstance().onGameStarted.add(this._onGameStarted);
    Game.getInstance().onGameStopped.add(this._onGameStopped);
  }

  // ---------- Cycle Play ----------
  private _onGameStarted = () => {
    // Le ColliderSystem fera l'appel à build* après activation du moteur physique.
    // Rien à créer ici : on laisse le système (re)construire.
  };

  private _onGameStopped = () => {
    // Nettoyage sûr
    this._physicsBody?.setCollisionCallbackEnabled?.(false);
    this._physicsBody?.dispose();
    this._physicsBody = undefined;
    this._physicsShape?.dispose();
    this._physicsShape = undefined;
  };

  // ---------- API requise pour toutes les formes ----------
  public abstract buildShapeInto(rb: Rigidbody): void;   // injecte la shape dans le container du RB
  public abstract buildStatic(): void;                   // crée body+shape STATIC sur ce node (quand aucun RB)
  public abstract _setDirty(v: boolean): void;           // flag interne

  /** Recherche RB parent standardisée */
  public findRigidbody(): Rigidbody | undefined {
    let cur: GameObject | undefined = this._gameObject;
    while (cur) {
      const rb = cur.getComponent(Rigidbody);
      if (rb) return rb;
      cur = cur.parent ?? undefined;
    }
    return undefined;
  }

  // Par défaut, les colliders n’updatent rien en runtime (rebuild par le système)
  public update(): void { /* no-op */ }
  public copyFrom<T extends Component>(_c: T): Component { return this; }
}
