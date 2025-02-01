import { GameObject } from "./GameObject"
import GameLoader from "@renderer/editor/GameLoader";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import Rigidbody from "./physics/lgm3D.Rigidbody";
import { Game } from "./Game";

export default class DemoTest {

    constructor() {
        GameLoader.onLevelLoaded.addOnce((scene) => {

            this.scene = scene;
            //const copyTest = GameObject.createInstance(GameObject.getById(27));
            LGM3DEditor.getInstance().updateObjectsTreeView();
        });
    }

    init = (scene: BABYLON.Scene) => {

        if (!DemoTest.init)
            return;
        DemoTest.init = false;
    }
    
    start() {
    }

    stop(scene: BABYLON.Scene) {

        this.scene.setActiveCameraById("_RENDERER_CAMERA_");
    }

    moveOponent() {

    }

}