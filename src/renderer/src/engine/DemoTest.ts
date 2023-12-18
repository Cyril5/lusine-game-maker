import { Space, Vector3 } from "babylonjs";
import { GameObject } from "./GameObject"
import BoxCollider from "./physics/BoxCollider"

export default class DemoTest {

    static firstrun = true;

    run = (scene: BABYLON.Scene) => {

        
        const car = GameObject.gameObjects.get(485);
        
        if(DemoTest.firstrun) {
            // const box = new BoxCollider(scene);
            // box.shape.position = car.position;
            // box.shape.setParent(car);
            
            //const box = new BoxCollider(scene);
            //box.gameObject.setParent(car);
            //box.attachToGameObject(car);
            //car.addRigidbody({mass:1,restitution:0.2,friction:0.5});
            
        }

        //car.position = new Vector3(0,50,0);
        
        if(DemoTest.firstrun) {
            
            var ground = BABYLON.Mesh.CreateGround("ground1", 100, 100, 2, scene);
            ground.position.y -= 10;
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0}, scene);

            const road = GameObject.gameObjects.get(29)!.getChildMeshes()[0];
            //console.log(road.name);
            road.position.y -= 20;
            road.setParent(null);
            road.physicsImpostor = new BABYLON.PhysicsImpostor(road, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0}, scene);
            road.setParent(GameObject.gameObjects.get(29));
        }
        
        
        if(DemoTest.firstrun) {
            DemoTest.firstrun = false;
        }
    }
}