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

        if (!DemoTest.init)
            return;
        DemoTest.init = false;

        // TANK movement test
          // ground + murs (comme avant)
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
        const gmat = new BABYLON.StandardMaterial("g", scene);
        gmat.diffuseColor = BABYLON.Color3.FromHexString("#3b3b3b");
        ground.material = gmat;
        new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.9, restitution: 0 }, scene);
        this.tankA = new Tank(scene, true,  new BABYLON.Vector3(-6, 0, -6)); // joueur
        //this.tankB = new Tank(scene, false, new BABYLON.Vector3( 6, 0,  6)); // cible statique
    }

    onGameUpdate() {
        this.tankA.update();
        //this.tankB.update();
    }
    
    start() {
    }

    stop(scene: BABYLON.Scene) {

        //this.scene.setActiveCameraById("_RENDERER_CAMERA_");
    }

}