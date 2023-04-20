import { Mesh, Scene, TransformNode } from "babylonjs";

export default class Collider {
    
    private boxMesh : Mesh;
    constructor(scene : Scene) {
        this.boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: 60, width: 75, depth: 140 }, scene);
        this.boxMesh.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
        this.boxMesh.visibility = 0.25;
        this.boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, { 
            mass: 0,
            restitution: 0,
            friction: 0,
        });
    }

    attachToNode(node : Node) {
        this.boxMesh.setParent(node);
    }

}