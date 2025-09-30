import { GameObject } from "../GameObject"
import GameLoader from "@renderer/editor/GameLoader";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { State } from "../FSM/lgm3D.State";
import { GreenTs as GreenLightCode, RedTs as RedLightCode, YellowTs as YellowLightCode } from "../FSM/test/TrafficLightsFSMStatesCode";
import { FiniteStateMachine } from "../FSM/lgm3D.FiniteStateMachine";
import { IStateFile } from "../FSM/IStateFile";

export default class DemoTest {
    private scene;
    private static init: boolean = true;

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
        async function initTrafficLightLogic() {
            const go = new GameObject("FSM_TEST", scene);
            const fsm = new FiniteStateMachine("TrafficLightFSM", "Crossroad#1", go);
            const stateFileA = new IStateFile("Red");
            stateFileA.outputCode = RedLightCode;
            const stateFileB = new IStateFile("Green");
            stateFileB.outputCode = GreenLightCode;
            const stateFileC = new IStateFile("Yellow");
            stateFileC.outputCode = YellowLightCode;
            const etatFeuRouge = new State("Feu rouge", stateFileA);
            fsm.addState(etatFeuRouge); 
            fsm.addState(new State("Feu vert", stateFileB));
            fsm.addState(new State("Feu Orange", stateFileC));
            go.addComponent("FiniteStateMachine", fsm);
            fsm.setState(etatFeuRouge);
            console.log(fsm.states);
        }
        initTrafficLightLogic();


    }

    onGameUpdate() {

    }

    start() {
    }

    stop(scene: BABYLON.Scene) {

        //this.scene.setActiveCameraById("_RENDERER_CAMERA_");
    }

}