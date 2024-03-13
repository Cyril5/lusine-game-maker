import { javascriptGenerator } from 'blockly/javascript';
import * as terser from 'terser';

import { IStateFile } from './IStateFile';

import { FSMObservable, FiniteStateMachine } from './FiniteStateMachine';
import { ProgrammableGameObject } from '../ProgrammableGameObject';

// NE PAS RETIRER CES IMPORTS ! (pour l'interprétation du code js avec eval)

import InputManager, { KeyCode } from '../InputManager';
import FileManager from '../FileManager';
import { Game } from '../Game';

//import StateEditorUtils from '@renderer/editor/StateEditorUtils';
//import BoxCollider from '../physics/BoxCollider';

export default class State {

  private static _runtimeGlobalVars: Array<any> = [InputManager, ["KeyCode", KeyCode]]; // ne pas oublier de supprimer la variable lorsqu'on clic sur Stop


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

  // local variables
  userVariables = {

  }

  onUpdateState: FSMObservable<void>;
  onEnterState: FSMObservable<void>;
  onExitState: FSMObservable<void>;

  constructor(fsm: FiniteStateMachine | undefined, stateFile: IStateFile | undefined) {
    if (fsm) {
      this.fsm = fsm;
      this.gameObject = fsm.gameObject;
    }

    if (stateFile) {
      // L'état peut être non relié à un fichier
      this.stateFile = stateFile;
    }

    this.onExitState = new FSMObservable();
    this.onEnterState = new FSMObservable();

    this.onEnterState.add(() => {
   console.log('ENTER !!');
 } );


    this.onUpdateState = new FSMObservable();

  }


  _leaveStateChecks() {
    // Callback : qui peut contenir que des if else if vers des actions de sorties vers des transitions
    // Du code est généré automatiquement quand l'utilisateur ajoute une transitions vers un autre état.
  }

  async runCode() { // run state code

    if(!this.stateFile)
      return;

    // On eval une seul fois les classes qui peuvent être utilisé par d'autres state
    // TODO : Mettre dans le tableau les classes existantes de tous les codes au lieu de tout importer.
    // if(this.stateFile.outputCode.includes(InputManager)) {
    //   // faire un eval
    // }

    const options = {
      compress: true,
      mangle: {
        toplevel: true,
      },
      nameCache: {},
    };
    
    if(!State._runtimeGlobalVars.includes(Game)) {
      State._runtimeGlobalVars.push(Game);
    }

    const objects = State._runtimeGlobalVars;
    for (let i = 0; i < objects.length; i++) {
      let object = objects[i];
      let clsName = object.name; // prendre le nom de la classe
      if (object[0]) {
        clsName = object[0]; // prendre un autre nom (pour les enum par exemple)
        object = JSON.stringify(object[1]); // Récupérer l'objet
      }

      const importCode: string = `
           if(!window.${clsName}) {
             window.${clsName} = ${object};
             //console.log("import "+${clsName});
           }else{
             //alert("${clsName} exists");
           }`;


      const minifiedObject = terser.minify(importCode, options).then((value) => {
        //console.log(value.code);
        eval(value.code);
      });
      // eval(`
      //     if(!window.${clsName}) {
      //       window.${clsName} = ${minifiedObject};
      //       console.log("import "+${clsName});
      //     }else{
      //       //alert("${clsName} exists");
      //     }`
      // );

    }


    // Clear all states callbacks
    this.onEnterState.clear();
    this.onExitState.clear();
    this.onUpdateState.clear(); 

    console.log(this.stateFile.codeFilename);
    console.log(this.stateFile.outputCode);

    if (this.stateFile.outputCode === "" && this.stateFile.needToLoad) {
      // récupérer le code depuis le fichier .state
      FileManager.readTextFile(this.stateFile.codeFilename, async (data) => {
        this.stateFile.outputCode = data;
        console.log(this.stateFile.outputCode);
        this.stateFile.needToLoad = false;
        await this.evalStateCode(options);
      });
    }else{

      // ne pas ré-evaluer le code car il a déjà était fait après l'ouverture du fichier du code
      await this.evalStateCode(options);
    }



  };

  private async evalStateCode(minifyOptions: any) {
    // Generate JavaScript code and run it.
    window.LoopTrap = 1000;
    javascriptGenerator.INFINITE_LOOP_TRAP = 'if(--window.LoopTrap == 0) throw "Infinite loop.";\n';


    const result = await terser.minify(this.stateFile.outputCode, minifyOptions);
    //console.log(result.code);

    try {
      eval(result.code);
    } catch (e: any) {
      console.error(this.name + "->" + e.message + " - line : (" + e.lineNumbers + ")", '#ff0000');
      console.error(e);
    }
  }

}