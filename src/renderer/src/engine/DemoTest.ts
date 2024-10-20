import { GameObject } from "./GameObject"
import GameLoader from "@renderer/editor/GameLoader";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import Rigidbody from "./physics/lgm3D.Rigidbody";
import { Game } from "./Game";

export default class DemoTest {

    private scene: BABYLON.Scene;
    private player: GameObject;
    private playerStartPos: BABYLON.Vector3;
    private oponent: ProgrammableGameObject;

    constructor() {
        GameLoader.onLevelLoaded.addOnce((scene) => {

            this.scene = scene;
            LGM3DEditor.getInstance().updateObjectsTreeView();
            this.oponent = GameObject.getById(68) as ProgrammableGameObject;
        });
    }

    init = (scene: BABYLON.Scene) => {

        if (!DemoTest.init)
            return;

        
        DemoTest.init = false;
        
    }
    
    start() {
        this.oponent.getComponent<Rigidbody>("Rigidbody").destroy();
        this.oponent._rigidbody = null;
        const followCam = this.scene.getCameraById("FollowCam");
        // followCam.lockedTarget = this.player.transform;
        // followCam.radius = 15;
        // followCam.rotationOffset = 180;
        // followCam.heightOffset = 5;
        //this.scene.setActiveCameraById("FollowCam");

        console.log("DEMO STARTS");
        //this.oponent.position = new BABYLON.Vector3(1,0,1);
        //this.oponent.transform.rotation.set(new BABYLON.Vector3(0,0,0));
        Game.getInstance().onGameUpdate.add(this.moveOponent);
    }

    stop(scene: BABYLON.Scene) {

        this.scene.setActiveCameraById("_RENDERER_CAMERA_");

        Game.getInstance().onGameUpdate.remove(this.moveOponent);

    }

    moveOponent() {
        this.oponent = GameObject.getById(68);
        
        const  dt = Game.deltaTime;
        this.oponent.move(BABYLON.Axis.Z,5 * dt,BABYLON.Space.LOCAL);
    }

}