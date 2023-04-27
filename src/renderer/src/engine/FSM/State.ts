import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';


import { IStateFile } from './IStateFile';

import { FiniteStateMachine } from './FiniteStateMachine';
import { ProgrammableGameObject } from '../ProgrammableGameObject';
import { Observable } from 'babylonjs';

// NE PAS RETIRER CES IMPORTS ! (pour l'interprétation du code js avec eval)
import InputManager, { KeyCode } from '../InputManager';

export default class State {

  private static _runtimeGlobalVars: any[] = [InputManager, ["KeyCode", KeyCode]]; // ne pas oublier de supprimer la variable lorsqu'on clic sur Stop

  static deleteRuntimeGlobalVars() {
    const arr = State._runtimeGlobalVars;

    for (let index = 0; index < arr.length; index++) {
      const globalVar = arr[index];
      // eval(`console.log(window.${globalVar});`);
      if (!globalVar[0]) {
        eval(`delete window.${globalVar.name};`);
      } else {
        eval(`delete window.${globalVar[0]};`);
      }
    }
  }

  readonly fsm: FiniteStateMachine;
  //code: string = '';
  private gameObject: ProgrammableGameObject | undefined;
  name = 'Etat Vide';

  stateFile: IStateFile = { filename: "", outputCode: "" };

  private test: string = "BOUYA !!!";

  // local variables
  userVariables = {

  }

  onUpdateState: Observable<void>;

  constructor(fsm: FiniteStateMachine | undefined, stateFile: IStateFile | undefined) {
    if (fsm) {
      this.fsm = fsm;
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

    // On eval une seul fois les classes qui peuvent être utilisé par d'autres state
    // TODO : Mettre dans le tableau les classes existantes de tous les codes au lieu de tout importer.
    // if(this.stateFile.outputCode.includes(InputManager)) {
    //   // faire un eval
    // }

    const objects = State._runtimeGlobalVars;
    for (let i = 0; i < objects.length; i++) {
      let object = objects[i];
      let clsName = object.name; // prendre le nom de la classe
      if (object[0]) {
        clsName = object[0]; // prendre un autre nom (pour les enum par exemple)
        object = JSON.stringify(object[1]); // Récupérer l'objet
      }

      eval(`
          if(!window.${clsName}) {
            window.${clsName} = ${object};
            console.log("import "+${clsName});
          }else{
            //alert("${clsName} exists");
          }`
      );
    }


    // Clear all states callbacks
    this.onEnterState = () => { };
    //this.onUpdateState.clear();
    this.onExitState = () => { };

    this.onUpdateState.clear();

    console.log(this.stateFile.outputCode);

    // Generate JavaScript code and run it.
    window.LoopTrap = 1000;
    javascriptGenerator.INFINITE_LOOP_TRAP = 'if(--window.LoopTrap == 0) throw "Infinite loop.";\n';
    try {
      eval(this.stateFile.outputCode);
    } catch (e: any) {
      console.error(this.name + "->" + e.message + " - line : (" + e.lineNumbers + ")", '#ff0000');
      console.error(e);
    }
  }

}