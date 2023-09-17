import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/Model3D";
import Editor from "@renderer/components/Editor";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";

export default abstract class GameLoader {

    private _scene: BABYLON.Scene;

    constructor(scene) {
        this._scene = scene;
    }

    public static save(scene: BABYLON.Scene) {
        console.log("saving");
        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement
        const strScene = JSON.stringify(serializedScene);
        //console.log(strScene);
        FileManager.writeInFile(ProjectManager.getFilePath('', 'game.lgm'), strScene, () => {
            EditorUtils.showInfoMsg("Projet sauvegardé !");
        });
        return;
    }

    public static load(scene) {

        const projectFile = ProjectManager.getFilePath('', 'game.lgm');
        const editor = Editor.getInstance();

        FileManager.fileIsEmpty(projectFile, (isEmpty) => {

            if (isEmpty) {
                editor.setupBaseScene();
            } else {
                editor.clearScene(scene);
                let nodes: BABYLON.Node[] | null = null;
                try {
                    BABYLON.SceneLoader.AppendAsync("", projectFile, scene).then(() => {
                        testMethode(scene);
                    });
                }
                catch (error) {
                    EditorUtils.showErrorMsg(error);
                }
            }

            editor.showStartupModal(false);
        });


        const testMethode = (scene) => {

            //0 : source, 1 : destinationID
            let goLinks: [number,number][] = []

            scene.getNodes().forEach((node) => {

                if (node.metadata?.type) {

                    //node.parent = null;

                    console.log(node.name);

                    if (node.metadata.type === Model3D.name) {

                        const model3d : Model3D = Model3D.createEmptyFromNodeData(node,scene);

                        node.getChildren().forEach((child) => {
                            console.log(child.name);
                            goLinks.push([child.uniqueId,model3d.uniqueId]);
                            child.setParent(null);
                        });
                        node.dispose();

                    } else if (node.metadata.type === ProgrammableGameObject.TYPE_NAME) {
                        const pgo = new ProgrammableGameObject(node.name,scene);
                        pgo.uniqueId = node.metadata.gameObjectId;
                        pgo.position.copyFrom(node.position);
                        pgo.rotation.copyFrom(node.rotation);
                        pgo.scaling.copyFrom(node.scaling);
                        
                        node.getChildren().forEach((child) => {
                            goLinks.push([child.uniqueId,pgo.uniqueId]);
                            child.setParent(null);
                        });
                        node.dispose();

                    }

                }
            });

            goLinks.forEach(el => {
                // alert(go.name+" \n "+JSON.stringify(go.metadata));
                console.log(el[0]);
                console.log(el[1]);
                let source = scene.getTransformNodeByUniqueId(el[0]);
                if(!source) {
                    source = scene.getMeshByUniqueId(el[0]);
                }
                const target = scene.getTransformNodeByUniqueId(el[1]);
                if(target && source) {
                    source.setParent(target);
                }
                console.log('-------------------');
                
            });

            console.log(GameObject.gameObjects);

            editor.updateObjectsTreeView();
        }

    }
}