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
  protected _worldChangedObserver;

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

  public _setDirty(v: boolean) { this._dirty = v; }

  constructor(owner: GameObject) {
    super(owner);
    this._scene = owner.scene;

    // Enregistrer ce collider côté système (rebuilds centralisés)
    ColliderSystem.registerCollider(this);
    ColliderSystem.install(this._scene);
    ColliderSystem.markDirty(this._gameObject);

    if (!Collider.COLLIDER_MAT) {
      Collider.COLLIDER_MAT = new BABYLON.StandardMaterial("_EDITOR_COLLIDER_MAT_", this._scene);
      Collider.COLLIDER_MAT.wireframe = true;
      Collider.COLLIDER_MAT.emissiveColor = BABYLON.Color3.Green();
      Collider.COLLIDER_MAT.disableLighting = true;
      Collider.COLLIDER_MAT.doNotSerialize = true;
      Collider.COLLIDER_MAT.alpha = 0.7;
      Collider.COLLIDER_MAT.backFaceCulling = false;
    }

    // Abonnements jeu : activer/désactiver uniquement pendant le Play
    Game.getInstance().onGameStarted.add(this._onGameStarted);
    Game.getInstance().onGameStopped.add(this._onGameStopped);
  }

  private _onGameStarted = () => {
    // On force la reconstruction au début du Play
    this._dirty = true;

    const rb = this.findRigidbody();

    if (rb) {
      // Collider attaché à un Rigidbody : on laisse le ColliderSystem
      // gérer le rebuild via rebuildShapes()
      ColliderSystem.markDirty(this._gameObject, true);
    } else {
      // Collider *statique* (pas de Rigidbody parent) :
      // on reconstruit le PhysicsBody/Shape *tout de suite*,
      // avec la transform actuelle (celle de l’éditeur).
      this.buildStatic();
    }
  };


  private _onGameStopped = () => {
    // Nettoyage sûr
    this._physicsBody?.setCollisionCallbackEnabled?.(false);
    this._physicsBody?.getCollisionObservable().removeCallback(this.detectionCollision);
    this._physicsBody?.dispose();
    this._physicsBody = undefined;
    this._physicsShape?.dispose();
    this._physicsShape = undefined;

    // Préparer le prochain Play pour reconstruire
    this._dirty = true;

    // Remet le GO dans la file des rebuilds (pour les RB notamment)
    ColliderSystem.markDirty(this._gameObject, true);
  };

  // ---------- API requise pour toutes les formes ----------
  public abstract buildShapeIntoBody(rb: Rigidbody): void;   // injecte la shape dans le container du RB
  public abstract buildStatic(): void;                   // crée body+shape STATIC sur ce node (quand aucun RB)
  //public abstract _setDirty(v: boolean): void;           // flag interne

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

  public onDestroy(): void {
    // Désabonner du onWorldTransformChanged si on était inscrit
    if (this._worldChangedObserver) {
      this._gameObject.onWorldTransformChanged.remove(this._worldChangedObserver);
      this._worldChangedObserver = undefined;
    }
    // 🔹 Nettoyer le gizmo de l’éditeur
    this._editorGizmo?.dispose();
    this._editorGizmo = undefined;

    // 🔹 Nettoyer la physique éventuelle
    this._physicsBody?.setCollisionCallbackEnabled?.(false);
    this._physicsBody?.dispose();
    this._physicsBody = undefined;
    this._physicsShape?.dispose();
    this._physicsShape = undefined;

    // Se désinscrire des events de Game
    Game.getInstance().onGameStarted.remove(this._onGameStarted);
    Game.getInstance().onGameStopped.remove(this._onGameStopped);
  }

  /**
 * Hook appelé quand le transform monde du GameObject change.
 * Par défaut :
 *  - empêche les scale négatifs (on prend la valeur absolue)
 *  - marque le collider comme dirty si on a modifié quelque chose.
 * Les classes dérivées peuvent surcharger et appeler super._handleWorldTransformChanged().
 */
  protected _handleWorldTransformChanged(): void {
    const s = this._gameObject.transform.scaling;
    let changed = false;

    if (s.x < 0) { s.x = Math.abs(s.x); changed = true; }
    if (s.y < 0) { s.y = Math.abs(s.y); changed = true; }
    if (s.z < 0) { s.z = Math.abs(s.z); changed = true; }

    if (changed) {
      // on force un rebuild physique cohérent
      this._dirty = true;
      ColliderSystem.markDirty(this._gameObject);
    }
  }

  detectionCollision(collisionEvent: BABYLON.IPhysicsCollisionEvent): void {
    if (collisionEvent.type == "COLLISION_STARTED") {
      // envoyer le message à l'objet root qui a un FSM
      console.log("COLLISION STARTED !!");
    }
  }

  // Deprecated
  // detectCollisionTrigger(event: string, trigger: boolean): void {
  //     for (let [key, otherCollider] of BoxCollider.colliders) {
  //         const otherColliderMesh = otherCollider.shape;
  //         if (trigger) {
  //             switch (event) {
  //                 case 'enter':
  //                     this._boxMesh.actionManager.registerAction(
  //                         new BABYLON.ExecuteCodeAction(
  //                             {
  //                                 trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
  //                                 parameter: {
  //                                     mesh: otherColliderMesh,
  //                                     usePreciseIntersection: false // false pour les boxCollider 
  //                                 }
  //                             },
  //                             () => {
  //                                 if (otherCollider) {
  //                                     console.log(`collision : ${this._boxMesh.name} & ${otherColliderMesh.name}`);

  //                                     (this._gameObject as ProgrammableGameObject)?.finiteStateMachines[0].onCollisionEnter.notifyObservers(otherCollider);
  //                                 }
  //                             }

  //                         )
  //                     );
  //                     break;
  //             }
  //         }
  //     }

  // }


}

