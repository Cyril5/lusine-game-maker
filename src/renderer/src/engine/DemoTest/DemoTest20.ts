import { GameObject } from "../GameObject"
import GameLoader from "@renderer/editor/GameLoader";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { Game } from "../Game";
import { Tank } from "./Tank";

export default class DemoTest {
    private scene;
    private static init : boolean = true;
    tankA! : Tank;
    tankB!: Tank;

    constructor() {
        GameLoader.onLevelLoaded.addOnce((scene) => {

            this.scene = scene;
            //const copyTest = GameObject.createInstance(GameObject.getById(27));
            LGM3DEditor.getInstance().updateObjectsTreeView();
        });
    }

    init = (scene: BABYLON.Scene) => {
        return; // Juste pour le test de l'éditeur

        if (!DemoTest.init)
            return;
        DemoTest.init = false;

        //ROAD
        const road = this.scene.getMeshByUniqueID(445);
        if(road) {
            new BABYLON.PhysicsAggregate(road, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 0.9, restitution: 0 });
        }
        this.tankA = new Tank(scene, true,  new BABYLON.Vector3(-6, 0, -6)); // joueur
        //this.tankB = new Tank(scene, false, new BABYLON.Vector3( 6, 0,  6)); // cible statique
    }

    onGameUpdate() {
        this.tankA?.update();
        //this.tankB.update();
    }
    
    start() {
    }

    stop(scene: BABYLON.Scene) {

        //this.scene.setActiveCameraById("_RENDERER_CAMERA_");
    }

}