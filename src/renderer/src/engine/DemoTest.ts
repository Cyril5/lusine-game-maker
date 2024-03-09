import { GameObject } from "./GameObject"
import BoxCollider from "./physics/lgm3D.BoxCollider"
import Editor from "@renderer/components/Editor";
import { Renderer } from "./Renderer";
import SphereCollider from "./physics/lgm3D.SphereCollider";
import Rigidbody from "./physics/lgm3D.Rigidbody";

export default class DemoTest {

    static firstrun = true;

    run = (scene: BABYLON.Scene) => {

        
        const car = GameObject.gameObjects.get(485);
        
        if(DemoTest.firstrun) {

            // const box = new BoxCollider(scene);
            // box.gameObject.position = car!.position;
            // car!.addRigidbody({mass:100,restitution:0.9,friction:0.5});
            // box.gameObject.setParent(car!);
            
            //car!._shapeContainer.addChild(box._colliderShape);

            const roadMesh = GameObject.gameObjects.get(29)!.getChildMeshes()[0];
            //console.log(road.name);
            // road.physicsImpostor = new BABYLON.PhysicsImpostor(road, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0}, scene);
            // road.setParent(GameObject.gameObjects.get(29));
            const aggregate = new BABYLON.PhysicsAggregate(roadMesh, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, scene);

            Editor.getInstance().updateObjectsTreeView();
            
            DemoTest.firstrun = false;
        }
    }

    update() {

    }

    stop(scene : BABYLON.Scene) {
        const car = GameObject.gameObjects.get(485);
        const carRb = car!.getComponent<Rigidbody>("Rigidbody");
        if(carRb) {
            carRb.body.disablePreStep = false; 
            carRb.body.transformNode.position.set(0,10,0);
            //car.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0,0,0);
            setTimeout(()=>{
                carRb.body.disablePreStep = true;
            },5000)
        }
        
    }
}