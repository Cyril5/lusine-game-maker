import { Space, Vector3 } from "babylonjs";
import { GameObject } from "./GameObject"
import BoxCollider from "./physics/BoxCollider"

export default class DemoTest {

    static firstrun = true;

    run = (scene: BABYLON.Scene) => {

        
        const car = GameObject.gameObjects.get(485);
        
        if(DemoTest.firstrun) {
            const box = new BoxCollider(scene);
            box.shape.position = car.position;
            box.shape.setParent(car);
        }

        car.position = new Vector3(0,50,0);
        
        if(DemoTest.firstrun) {
            car.addRigidbody({mass:1,restitution:0.2,friction:0.5});
            
            var ground = BABYLON.Mesh.CreateGround("ground1", 100, 100, 2, scene);
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0}, scene);

            const road = GameObject.gameObjects.get(29)!.getChildMeshes()[0];
            //console.log(road.name);
            road.physicsImpostor = new BABYLON.PhysicsImpostor(road, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0.7, friction: 0.5 }, scene);
        }
        
        
        if(DemoTest.firstrun) {
            DemoTest.firstrun = false;
        }
    }
}