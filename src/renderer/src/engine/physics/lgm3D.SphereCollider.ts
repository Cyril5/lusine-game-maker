export default class SphereCollider {

    constructor(scene: BABYLON.Scene) {

        const mesh = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 16 }, scene);
        const sphereAggregate = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, scene);

        const viewer = new BABYLON.Debug.PhysicsViewer();
        viewer.showBody(mesh.physicsBody);
    };

}