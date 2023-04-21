import Blockly from 'blockly';
import {javascriptGenerator} from 'blockly/javascript';


import { IStateFile } from './IStateFile';

import { FiniteStateMachine } from './FiniteStateMachine';
import { ProgrammableGameObject } from '../ProgrammableGameObject';
import { Observable } from 'babylonjs';


export class State {

  readonly fsm: FiniteStateMachine;
  //code: string = '';
  private gameObject: ProgrammableGameObject | undefined;
  name = 'Etat Vide';
  
  stateFile: IStateFile | undefined;

  private test : string = "BOUYA !!!";
  
  // local variables
  userVariables = {
    
  }

  onUpdateState : Observable<void>;

  constructor(fsm: FiniteStateMachine | undefined, stateFile: IStateFile | undefined) {
    if (fsm) {
      this.fsm = fsm;
      console.log("apply gameobject : "+fsm.gameObject.name);
      this.gameObject = fsm.gameObject;
    }
    this.onUpdateState = new Observable();

    if (stateFile) {
      // L'état peut être non relié à un fichier
      this.stateFile = stateFile;

    }
  }

  onEnterState() {

  }


  onExitState() {

  }

  _leaveStateChecks() {
    // Callback : qui peut contenir que des if else if vers des actions de sorties vers des transitions
    // Du code est généré automatiquement quand l'utilisateur ajoute une transitions vers un autre état.
  }


  runCode() { // run state code

    //if(this.statefile===undefined) // ne pas executé du code si il n'y a pas de statefile
    //return;

    this.onUpdateState.notifyObservers();

    // Clear all states callbacks
    this.onEnterState = () => { };
    //this.onUpdateState.clear();
    this.onExitState = () => { };

    try {
      //eval(this);
      //eval(ProgrammableGameObject);
    }catch(error) {
      console.error(error);
    }


    console.log(this.stateFile.outputCode);

    // Generate JavaScript code and run it.
    //(window as any).LoopTrap = 1000;
    //javascriptGenerator.INFINITE_LOOP_TRAP = 'if (--window.LoopTrap === 0) throw "Infinite loop.";\n';
    //javascriptGenerator.INFINITE_LOOP_TRAP = null;
    try {
      eval(this.stateFile.outputCode);
    } catch (e: any) {
      console.error(this.name + "->" + e.message + " - line : (" + e.lineNumbers + ")", '#ff0000');
      console.error(e);
    }
  }

}