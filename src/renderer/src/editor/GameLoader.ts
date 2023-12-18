import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/Model3D";
import Editor from "@renderer/components/Editor";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import StateEditorUtils from "./StateEditorUtils";
import { IStateFile } from "@renderer/engine/FSM/IStateFile";

export default abstract class GameLoader {

    private _scene: BABYLON.Scene;

    constructor(scene) {
        this._scene = scene;
    }

    public static save(scene: BABYLON.Scene) {
        console.log("saving");
        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement

        //Enlever les transformNodes de l'editeur
        const editorNodes = serializedScene.transformNodes as any[];
        const meshes = serializedScene.meshes as any[];
        const materials = serializedScene.materials as any[];
        // const textures = serializedScene.textures as any[];

        [editorNodes, meshes, materials].forEach((arr, index) => {
            let tags: string;
            for (let i = arr.length - 1; i >= 0; i--) {
                let element = arr[i];
                tags = element.tags;

                if (arr[i].name.includes('_EDITOR_')) {
                    console.log('exclude : ' + arr[i].name);
                    arr.splice(i, 1);
                }

            }
        });


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
            let goLinks: [number, number][] = []

            // index 0 : l'id orginal, l'id du gameObject lié à l'original 
            let converted: Map<number, number> = new Map<number, number>();


            scene.getNodes().forEach((node) => {

                if (node.metadata?.type) {

                    if (node.metadata.type === Model3D.name) {

                        const model3d: Model3D = Model3D.createEmptyFromNodeData(node, scene);
                        model3d.setUId(node.metadata.gameObjectId);
                        node.name += " (orig)";
                        model3d.position.copyFrom(node.position);
                        model3d.rotation.copyFrom(node.rotation);
                        // model3d.scaling = node.scaling;
                        converted.set(node.uniqueId, model3d.Id);

                        if (node.parent) {
                            //test
                            //model3d.parent = node.parent;

                            goLinks.push([model3d.Id, node.parent.metadata.gameObjectId]);
                        }

                        node.getChildren().forEach((child) => {
                            child.parent = model3d;
                        });

                        //node.dispose();

                    } else if (node.metadata.type === ProgrammableGameObject.TYPE_NAME) {
                        const pgo = new ProgrammableGameObject(node.name, scene);
                        pgo.setUId(node.metadata.gameObjectId);
                        node.name += " (orig)";
                        pgo.position.copyFrom(node.position);
                        pgo.rotation.copyFrom(node.rotation);
                        pgo.scaling.copyFrom(node.scaling);
                        
                        //FSM
                        node.metadata.finiteStateMachines.forEach((fsmData,index) => {
                            const fsm = pgo.finiteStateMachines[index];
                            fsm.name = fsmData.name;

                            fsmData.states.forEach((stateData,index) => {
                                const state = fsm.states[index];
                                state.stateFile = StateEditorUtils.getStateFile(stateData.statefile.name);
                            });
                            
                        });

                        // node.getChildren().forEach((child) => {
                        //     console.log("CHILD : " + child.name);
                        //     child.parent = pgo;
                        // });
                        // node.dispose();

                    }

                }
            });

            goLinks.forEach(el => {

                let source = scene.getTransformNodeByUniqueId(el[0]);
                if (!source) {
                    source = scene.getMeshByUniqueId(el[0]);
                }
                const target = scene.getTransformNodeByUniqueId(el[1]);
                if (target && source) {
                    source.parent = target;
                }
                //console.log('-------------------');

            });

            scene.getNodes().forEach(element => {
                if(element.name.includes('(orig)')) {
                    element.dispose();
                }
            });

            //console.log(GameObject.gameObjects);
            editor.setupBaseScene();
            editor.updateObjectsTreeView();
        }

    }
}