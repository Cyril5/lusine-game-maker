import { GameObject } from "@renderer/engine/GameObject";
import * as BABYLON from "babylonjs";

export type Space = "world" | "local";

export interface TransformSnapshot {
  space: Space;
  position: BABYLON.Vector3;
  rotation: BABYLON.Quaternion; // rotation quaternion
  scaling: BABYLON.Vector3;
}

export function snapshotTransform(go: GameObject, space: Space): TransformSnapshot {
  if (space === "world") {
    // world
    return {
      space,
      position: go.worldPosition,               // à adapter à ton API
      rotation: go.worldRotationQuaternion,     // idem
      scaling: go.scale                  // idem (attention parents)
    };
  } else {
    // local
    return {
      space,
      position: go.localPosition,
      rotation: go.rotationQuaternion,
      scaling: go.scale
    };
  }
}

export function applySnapshot(go: GameObject, snap: TransformSnapshot) {
  if (snap.space === "world") {
    go.setWorldPosition(snap.position); // “world”
    go.setRotationQuaternion(snap.rotation);
    go.setScale(snap.scaling);
    // go.setWorldScaling?.(snap.scaling) ?? go.setLocalScaling(snap.scaling); // fallback
  } else {
    go.setLocalPosition(snap.position);
    go.setRotationQuaternion(snap.rotation);
    go.setScale(snap.scaling);
  }
}