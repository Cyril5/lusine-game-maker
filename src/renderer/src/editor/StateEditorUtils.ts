import { IStateFile } from "@renderer/engine/FSM/IStateFile";
import { Game } from "@renderer/engine/Game";
import Editor from "../components/EditorOld";
import BaseStateFile from '@renderer/assets/BaseStateFile.xml?raw';
import FileManager from "@renderer/engine/lgm3D.FileManager";
import EditorUtils from "./EditorUtils";
import ProjectManager from "./ProjectManager";
import LGM3DEditor from "./LGM3DEditor";

export default class StateEditorUtils {

    
    static _stateFilesFormat = "xml"; //private set public get => json ou xml (load json ne fonctionne pas pour le moment)
    static _stateCodeFilesFormat = "state";
    
    private static _stateFiles: Map<string, IStateFile> = new Map<string, IStateFile>();
    
    static getStatesFiles() {
        return StateEditorUtils._stateFiles;
    }
    
    static getStateFile(name: string): IStateFile | null {

        const result = this._stateFiles.get(name);
        if (result) {
            return result;
        }
        EditorUtils.showErrorMsg(`StateFile : ${name} not found in list`);
        return null;
    }
    
    //Charger la liste de tous les fichiers d'états
    static loadStateFilesList() {
        
        try{
            const stateFiles = FileManager.getDirectoryFiles(
                ProjectManager.getStateFilesDirectory(), ['.'+StateEditorUtils._stateFilesFormat],(files)=>{
                    for(let file of files) {
                        const className = file.split(".")[0];
                        StateEditorUtils.addStateFile(className);
                    }
                });
    
            }catch(err){
                console.error(err);
                //EditorUtils.showErrorMsg(err);
        }
        
    }

    static createStateFile = async (className: string) => {
        // 1.Créer le fichier dans le dossier States du projet 
        // 2.Attribuer un code de base
        const fileLocation = ProjectManager.getFilePath("States", className + '.' + StateEditorUtils._stateFilesFormat);
        const fileCodeLocation = ProjectManager.getFilePath("States", className + '.' + StateEditorUtils._stateCodeFilesFormat);
        // fs.writeFile(fileLocation, BaseStateFile, (err) => {
        //     if (err) throw err;
        // });
        
        if (FileManager.fileExists(fileLocation) || FileManager.fileExists(fileCodeLocation)) {
            EditorUtils.showErrorMsg(`Un fichier d'état dans le projet porte déjà le nom : ${className}`);
            return;
        }
        
        const t = async()=>{
            FileManager.writeInFile(fileLocation, BaseStateFile, () => {
                console.log('Le fichier a été créé ! => ' + fileLocation);
            });
            
            // Code vide
            FileManager.writeInFile(fileCodeLocation, "", () => {
                
            });
        }
        
        await t();
        this.addStateFile(className);

    }

    static removeStateFile = (name: string) : void=> {
        StateEditorUtils._stateFiles.delete(name);
    }
    
    //Recherche un fichier d'état et l'applique sur un statefile
    static addStateFile = (name: string) : void => {
        const fileLocation = ProjectManager.getFilePath("States", name + '.' + StateEditorUtils._stateFilesFormat);
        const codeFileLocation = ProjectManager.getFilePath("States", name + '.' + StateEditorUtils._stateCodeFilesFormat);
        
        if (!FileManager.fileExists(fileLocation)) {
            EditorUtils.showErrorMsg("Le fichier d'état : " + name + " est introuvable dans : " + fileLocation);
            return;
        }
        if (!FileManager.fileExists(codeFileLocation)) {
            EditorUtils.showErrorMsg("Le fichier d'état : " + name + " est introuvable dans : " + codeFileLocation);
            return;
        }

        const stateFile: IStateFile = new IStateFile(name);
        stateFile.filename = fileLocation;
        stateFile.codeFilename = codeFileLocation;
        stateFile.needToLoad = true;

        StateEditorUtils._stateFiles.set(name, stateFile);
        EditorUtils.updateStatesFilesList();

        if (StateEditorUtils._stateFiles.size == 1) {

            // Si c'est le premier du projet alors l'ouvrir dans l'éditeur d'état
            LGM3DEditor.getInstance().states.setInitStateFile(StateEditorUtils._stateFiles.get(name));
            // LGM3DEditor.getInstance().setState({ initStateFile: StateEditorUtils._stateFiles.get(name) }, () => {
            // });
        }
    }

}