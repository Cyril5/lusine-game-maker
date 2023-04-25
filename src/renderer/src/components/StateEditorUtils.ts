import { IStateFile } from "@renderer/engine/FSM/IStateFile";
import { Game } from "@renderer/engine/Game";
import Editor from "./Editor";
import BaseStateFile from '@renderer/assets/BaseStateFile.json?raw';
import FileManager from "@renderer/engine/FileManager";

export default class StateEditorUtils {
    
    static _stateFiles : Array<IStateFile> = new Array<IStateFile>();

    static _stateFilesFormat = "xml"; //private set public get => json ou xml (load json ne fonctionne pas pour le moment)
    
    static createStateFile = (name: string, stateFile : IStateFile) => {
        // 1.Créer le fichier dans le projet (C:\Users\cyril\Documents\Lusine Game Maker\MonProjet\States)
        // 2.Attribuer un code de base
        const fs = require('fs');
        const fileLocation = Game.getFilePath("States", name+'.'+StateEditorUtils._stateFilesFormat);

        // fs.writeFile(fileLocation, BaseStateFile, (err) => {
        //     if (err) throw err;
        // });
        
        FileManager.writeInFile(fileLocation,BaseStateFile,()=>{
            console.log('Le fichier a été créé ! => '+fileLocation);
            stateFile.filename = fileLocation;
        });

        StateEditorUtils._stateFiles.push(stateFile);

        if(StateEditorUtils._stateFiles.length == 1) {
            Editor.getInstance().setState({initStateFile:StateEditorUtils._stateFiles[0]},()=>{
                console.warn(Editor.getInstance().state);
                
            });
        }
        
    }

    //Recherche un fichier d'état et l'applique sur un statefile
    static addStateFile = (name : string,stateFile : IStateFile) => {
        const fileLocation = Game.getFilePath("States", name+'.'+StateEditorUtils._stateFilesFormat);
        stateFile.filename = fileLocation;
        StateEditorUtils._stateFiles.push(stateFile);

        if(StateEditorUtils._stateFiles.length == 1) {
            Editor.getInstance().setState({initStateFile:StateEditorUtils._stateFiles[0]},()=>{
            });
        }
    }
}