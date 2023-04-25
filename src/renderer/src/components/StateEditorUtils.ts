import { IStateFile } from "@renderer/engine/FSM/IStateFile";
import { Game } from "@renderer/engine/Game";
import Editor from "./Editor";
import BaseStateFile from '@renderer/assets/BaseStateFile.json?raw';

export default class StateEditorUtils {
    
    static createStateFile = (name: string, stateFile : IStateFile) => {
        // 1.Créer le fichier dans le projet (C:\Users\cyril\Documents\Lusine Game Maker\MonProjet\States)
        // 2.Attribuer un code de base
        const fs = require('fs');
        const fileLocation = Game.getFilePath("States", name+".json");

        fs.writeFile(fileLocation, BaseStateFile, (err) => {
            if (err) throw err;
            console.log('Le fichier a été créé ! => '+fileLocation);
            stateFile.filename = fileLocation;
        });
        Editor._stateFiles.push(stateFile);

        if(Editor._stateFiles.length == 1) {
            Editor.getInstance().setState({initStateFile:Editor._stateFiles[0]},()=>{
                console.warn(Editor.getInstance().state);
                
            });
        }
        
    }
}