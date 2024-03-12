import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/Model3D";
import Editor from "@renderer/components/Editor";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import StateEditorUtils from "./StateEditorUtils";
import Collider from "@renderer/engine/physics/lgm3D.Collider";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";

export default abstract class GameLoader {

    private _scene: BABYLON.Scene;

    constructor(scene) {
        this._scene = scene;
    }

    public static save(scene: BABYLON.Scene) {
        console.log("saving");
        
        scene.transformNodes.filter((tNode) => tNode.metadata).forEach((node)=>{
            (node as GameObject).save();
        });

        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement

        //Enlever les transformNodes de l'editeur
        const editorNodes = serializedScene.transformNodes as any[];
        const meshes = serializedScene.meshes as any[];
        const materials = serializedScene.materials as any[];
        // const textures = serializedScene.textures as any[];


        [editorNodes, meshes, materials,serializedScene.cameras].forEach((arr, index) => {
            let tags: string;
            for (let i = arr.length - 1; i >= 0; i--) {
                let element = arr[i];
                tags = element.tags;

                if (element.name.includes('_EDITOR_')) {
                    console.log('exclude : ' + element.name);
                    arr.splice(i, 1);
                }
            }
        });

        const strScene = JSON.stringify(serializedScene);
        //console.log(strScene);
        FileManager.writeInFile(ProjectManager.getFilePath('', 'game.lgm'), strScene, () => {
            EditorUtils.showInfoMsg("Projet sauvegardé !");
        });
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
                        processNodes(scene);
                    });
                }
                catch (error) {
                    EditorUtils.showErrorMsg(error);
                }
            }

            editor.showStartupModal(false);
        });


        const processNodes = (scene : BABYLON.Scene) => {

            //0 : source, 1 : destinationID
            let goLinks: [number, number][] = []

            // index 0 : l'id orginal, l'id du gameObject lié à l'original 
            let converted: Map<number, number> = new Map<number, number>();


            scene.getNodes().forEach((node) => {

                const nodeData = node.metadata;

                if (nodeData?.type) {

                    //component
                    if(nodeData.components) {
                        nodeData.components.forEach(component => {
                            if(component.type == Collider.name) {
                                const collGo = GameObject.createFromTransformNodeMetaData(node,scene);
                                collGo.addComponent(new BoxCollider(scene,collGo),"BoxCollider");
                                converted.set(node.uniqueId, collGo.Id);

                                if (node.parent) {
                                    goLinks.push([collGo.Id, node.parent.metadata.gameObjectId]);
                                }
        
                                // node.getChildren().forEach((child) => {
                                //     child.parent = collGo;
                                // });
                            }
                        });
                    }
                    
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
                                if(stateData.statefile.name) {
                                    state.stateFile = StateEditorUtils.getStateFile(stateData.statefile.name);
                                }
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