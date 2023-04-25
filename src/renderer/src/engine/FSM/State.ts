import Blockly from 'blockly';
import {javascriptGenerator} from 'blockly/javascript';


import { IStateFile } from './IStateFile';

import { FiniteStateMachine } from './FiniteStateMachine';
import { ProgrammableGameObject } from '../ProgrammableGameObject';
import { Observable } from 'babylonjs';

// NE PAS RETIRER CES IMPORTS ! (pour l'interprétation du code js avec eval)
import InputManager, { KeyCode } from '../InputManager';


export class State {

  readonly fsm: FiniteStateMachine;
  //code: string = '';
  private gameObject: ProgrammableGameObject | undefined;
  name = 'Etat Vide';
  
  stateFile: IStateFile = {filename: "", outputCode: ""};

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
    
    if (stateFile) {
      // L'état peut être non relié à un fichier
      this.stateFile = stateFile;
      
    }
    
    this.onUpdateState = new Observable();
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

    // Clear all states callbacks
    this.onEnterState = () => { };
    //this.onUpdateState.clear();
    this.onExitState = () => { };

    this.onUpdateState.clear();

    console.log(this.stateFile.outputCode);

    // Generate JavaScript code and run it.
    //(window as any).LoopTrap = 1000;
    //javascriptGenerator.INFINITE_LOOP_TRAP = 'if (--window.LoopTrap === 0) throw "Infinite loop.";\n';
    //javascriptGenerator.INFINITE_LOOP_TRAP = null;
    try {
      eval(InputManager); // TODO : Vérifier si l'import ce fait une fois
      eval(KeyCode);
      eval(this.stateFile.outputCode);
    } catch (e: any) {
      console.error(this.name + "->" + e.message + " - line : (" + e.lineNumbers + ")", '#ff0000');
      console.error(e);
    }
  }

}