import { IStateFile } from "@renderer/engine/FSM/IStateFile";
import { Game } from "@renderer/engine/Game";
import Editor from "../components/Editor";
import BaseStateFile from '@renderer/assets/BaseStateFile.xml?raw';
import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils";
import ProjectManager from "./ProjectManager";

export default class StateEditorUtils {

    static _stateFilesFormat = "xml"; //private set public get => json ou xml (load json ne fonctionne pas pour le moment)
    static _stateCodeFilesFormat = "state";
    private static _stateFiles : Map<string,IStateFile> = new Map<string,IStateFile>();

    static getStateFile(name: string): IStateFile | null {
        
        const result = this._stateFiles.get(name);
        if(result) {
            return result;
        }
        EditorUtils.showErrorMsg(`StateFile : ${name} not found in list`);
        return null;
    }
    
    static createStateFile = (className: string) => {
        // 1.Créer le fichier dans le projet (C:\Users\cyril\Documents\Lusine Game Maker\MonProjet\States)
        // 2.Attribuer un code de base
        const fileLocation = ProjectManager.getFilePath("States", className+'.'+StateEditorUtils._stateFilesFormat);
        const fileCodeLocation = ProjectManager.getFilePath("States", className+'.'+StateEditorUtils._stateCodeFilesFormat);
        // fs.writeFile(fileLocation, BaseStateFile, (err) => {
        //     if (err) throw err;
        // });

        if(FileManager.fileExists(fileLocation) || FileManager.fileExists(fileCodeLocation)) {
            EditorUtils.showErrorMsg(`Un fichier d'état dans le projet porte déjà le nom : ${className}`);
            return;
        }
        
        FileManager.writeInFile(fileLocation,BaseStateFile,()=>{
            console.log('Le fichier a été créé ! => '+fileLocation);
        });

        // Code vide
        FileManager.writeInFile(fileCodeLocation,"",()=>{

        });

        this.addStateFile(className);
        
    }

    //Recherche un fichier d'état et l'applique sur un statefile
    static addStateFile = (name : string) => {
        const fileLocation = ProjectManager.getFilePath("States", name+'.'+StateEditorUtils._stateFilesFormat);
        const codeFileLocation = ProjectManager.getFilePath("States", name+'.'+StateEditorUtils._stateCodeFilesFormat);

        if(!FileManager.fileExists(fileLocation)) {
            EditorUtils.showErrorMsg("Le fichier d'état : "+ name +" est introuvable dans : "+fileLocation);
            return;
        }
        if(!FileManager.fileExists(codeFileLocation)) {
            EditorUtils.showErrorMsg("Le fichier d'état : "+ name +" est introuvable dans : "+codeFileLocation);
            return;
        }
        
        const stateFile : IStateFile = new IStateFile(name);
        stateFile.filename = fileLocation;
        stateFile.codeFilename = codeFileLocation;
        console.warn(stateFile.codeFilename);
        stateFile.needToLoad = true;
        
        StateEditorUtils._stateFiles.set(name,stateFile);

        if(StateEditorUtils._stateFiles.size == 1) {

            // Si c'est le premier du projet alors l'ouvrir dans l'éditeur d'état
            Editor.getInstance().setState({initStateFile:StateEditorUtils._stateFiles.get(name)},()=>{
            });
        }
    }

}