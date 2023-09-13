import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/Model3D";
import Editor from "@renderer/components/Editor";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";

export default abstract class GameLoader {

    private _scene : BABYLON.Scene;

    constructor(scene) {
        this._scene = scene;
    }

    public static save(scene : BABYLON.Scene) {
        console.log("saving");
        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement
        const strScene = JSON.stringify(serializedScene);
        //console.log(strScene);
        FileManager.writeInFile(ProjectManager.getFilePath('','game.lgm'),strScene,()=>{
            EditorUtils.showInfoMsg("Projet sauvegardé !");
        });
        return;
    }

    public static load(scene) {

        const projectFile = ProjectManager.getFilePath('','game.lgm');
        const editor = Editor.getInstance();

        FileManager.fileIsEmpty(projectFile,(isEmpty)=>{

            if(isEmpty) {
                editor.setupBaseScene();
                return;
            }

            editor.clearScene(scene);
            BABYLON.SceneLoader.Append("", projectFile, scene, function (scene) {
                    editor.showStartupModal(false);
                    testMethode(scene);
            });
        });
        
        
        const testMethode = (scene)=> {            
            scene.getNodes().forEach((node)=>{
                if(node.metadata?.type) {
                    let test = null;
                    let isGameObject = true;
                    if(node.metadata.type === Model3D.name) {
                        test = node as Model3D;
                    }else if(node.metadata.type === ProgrammableGameObject.TYPE_NAME) {
                        test = node as ProgrammableGameObject;
                    }else{
                        isGameObject = false;
                    }

                    if(isGameObject) {
                        GameObject.gameObjects.set(node.metadata.gameObjectId,test);
                    }
                }
            });
            editor.updateObjectsTreeView();
        }

    }
}