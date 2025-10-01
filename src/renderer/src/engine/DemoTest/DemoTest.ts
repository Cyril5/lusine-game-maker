import { GameObject } from "../GameObject"
import GameLoader from "@renderer/editor/GameLoader";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { State } from "../FSM/lgm3D.State";
import { GreenTs as GreenLightCode, RedTs as RedLightCode, YellowTs as YellowLightCode } from "../FSM/test/TrafficLightsFSMStatesCode";
import { FiniteStateMachine } from "../FSM/lgm3D.FiniteStateMachine";
import { StateFile } from "../FSM/IStateFile";

export default class DemoTest {
    private scene;
    private static init: boolean = true;
    private fsm? : FiniteStateMachine;
    private etatFeuRouge?: State;

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
        const initTrafficLightLogic = async ()=> {
            const go = new GameObject("FSM_TEST", scene);
            const stateFileA = new StateFile("Red");
            stateFileA.outputCode = RedLightCode;
            const stateFileB = new StateFile("Green");
            stateFileB.outputCode = GreenLightCode;
            const stateFileC = new StateFile("Yellow");
            stateFileC.outputCode = YellowLightCode;
            this.etatFeuRouge = new State("Feu rouge", stateFileA);
            this.fsm = new FiniteStateMachine("TrafficLightFSM", "Crossroad#1", go);
            this.fsm.addState(this.etatFeuRouge); 
            this.fsm.addState(new State("Feu vert", stateFileB));
            this.fsm.addState(new State("Feu Orange", stateFileC));
            go.addComponent("FiniteStateMachine", this.fsm);
        }
        initTrafficLightLogic();


    }

    onGameUpdate() {

    }

    start() {
        this.fsm!.setStateSilently(this.etatFeuRouge);
    }

    stop(scene: BABYLON.Scene) {

        //this.scene.setActiveCameraById("_RENDERER_CAMERA_");
    }

}