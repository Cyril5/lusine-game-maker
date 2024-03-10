import { GameObject } from "./GameObject"
import Editor from "@renderer/components/Editor";

export default class DemoTest {

    static firstrun = true;

    run = (scene: BABYLON.Scene) => {

        
        const car = GameObject.gameObjects.get(485);
        
        if(DemoTest.firstrun) {

            // const carCollider = new GameObject("CarCollider",scene);
            // carCollider.addComponent(new BoxCollider(scene,carCollider),"BoxCollider");
            // carCollider.scaling = new BABYLON.Vector3(3,3,3);
            // carCollider.setParent(car);
            // carCollider.setPositionWithLocalVector(new BABYLON.Vector3(0,0,0));

            // const obstacle =  new GameObject("Obstacle",scene);
            // obstacle.position = new BABYLON.Vector3(0,5,0);
            // obstacle.addComponent(new BoxCollider(scene,obstacle),"BoxCollider");

            
            // box.gameObject.position = car!.position;
            // car!.addRigidbody({mass:100,restitution:0.9,friction:0.5});
            // box.gameObject.setParent(car!);
            
            //car!._shapeContainer.addChild(box._colliderShape);

            const roadMesh = GameObject.gameObjects.get(29)!.getChildMeshes()[0];
            const aggregate = new BABYLON.PhysicsAggregate(roadMesh, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, scene);

            //car!.addComponent(new Rigidbody(car),"Rigidbody");
            
            Editor.getInstance().updateObjectsTreeView();
            
            DemoTest.firstrun = false;
        }
    }

    update() {

    }

    stop(scene : BABYLON.Scene) {
        // const car = GameObject.gameObjects.get(485);
        // const carRb = car!.getComponent<Rigidbody>("Rigidbody");
        // if(carRb) {
        //     carRb.body.disablePreStep = false; 
        //     carRb.body.transformNode.position.set(0,10,0);
        //     //car.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0,0,0);
        //     setTimeout(()=>{
        //         carRb.body.disablePreStep = true;
        //     },5000)
        // }
        
    }
}