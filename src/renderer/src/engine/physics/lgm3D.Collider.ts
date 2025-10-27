import { Game } from "../Game";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import ColliderSystem from "./lgm3D.ColliderSystem";
import { Rigidbody } from "./lgm3D.Rigidbody";
import * as BABYLON from "@babylonjs/core";

export default abstract class Collider extends Component {

  protected PHYSICS_MARGIN = 0.998; // ou 0.995 (correction visuelle pour compenser la marge physique).
  static COLLIDER_MAT: BABYLON.StandardMaterial;
  protected _scene: BABYLON.Scene;
  protected _editorGizmo?: BABYLON.AbstractMesh;     // maillage proxy (wireframe) pour l’éditeur
  protected _physicsBody?: BABYLON.PhysicsBody;      // seulement en Play
  protected _physicsShape?: BABYLON.PhysicsShape;    // seulement en Play
  protected _dirty = true;
  protected _isTrigger = false;
  protected _material: BABYLON.PhysicsMaterial = {
    friction: 0.5,
    restitution: 0.0,
  };

  /** Définit la friction du matériau physique. */
  public setFriction(value: number) {
    this._material.friction = value;
    if (this._physicsShape) this._physicsShape.material = this._material;
  }

  /** Définit la restitution (rebond). */
  public setRestitution(value: number) {
    this._material.restitution = value;
    if (this._physicsShape) this._physicsShape.material = this._material;
  }

  /** Retourne le matériau complet (friction + restitution). */
  public getMaterial(): BABYLON.PhysicsMaterial {
    return this._material;
  }

  /** Applique le matériau courant à la shape (appelé après création). */
  protected _applyMaterial(shape?: BABYLON.PhysicsShape) {
    const target = shape ?? this._physicsShape;
    if (target) target.material = this._material;
  }


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
  public abstract buildShapeIntoBody(rb: Rigidbody): void;   // injecte la shape dans le container du RB
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
