import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/Model3D";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import StateEditorUtils from "./StateEditorUtils";
import Collider from "@renderer/engine/physics/lgm3D.Collider";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import AssetsManager from "./AssetsManager";
import { Observable } from "babylonjs";
import Utils from "@renderer/engine/lgm3D.Utils";
import LGM3DEditor from "./LGM3DEditor";

//import logo from "../assets/logo.png";

export default abstract class GameLoader {

    private _scene: BABYLON.Scene;
    static onLevelLoaded: Observable<BABYLON.Scene> = new Observable();

    constructor(scene) {
        this._scene = scene;
        GameLoader.onLevelLoaded = new Observable();
    }

    // private static onProgressSceneLoader(event : BABYLON.ISceneLoaderProgressEvent) {
    //     let loadedPercent = 0;
    //     if (event.lengthComputable) {
    //         loadedPercent = (event.loaded * 100 / event.total).toFixed();
    //     } else {
    //         var dlCount = event.loaded / (1024 * 1024);
    //         loadedPercent = Math.floor(dlCount * 100.0) / 100.0;
    //     }
    // };

    public static save(scene: BABYLON.Scene) {
        console.log("saving");

        GameObject.gameObjects.forEach((gameObject) => {
            gameObject.save();
        });

        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement

        //Enlever les transformNodes de l'editeur
        const editorNodes = serializedScene.transformNodes as any[];
        const meshes = serializedScene.meshes as any[];
        const materials = serializedScene.materials as any[];
        // const textures = serializedScene.textures as any[];


        [editorNodes, meshes, materials, serializedScene.cameras].forEach((arr, index) => {
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
        const editor = LGM3DEditor.getInstance();

        FileManager.fileIsEmpty(projectFile, (isEmpty) => {

            if (isEmpty) {
                editor.setupBaseScene();
                //EditorUtils.showErrorMsg("Projet invalide !");
                return;
            } else {
                editor.clearScene(scene);
                let nodes: BABYLON.Node[] | null = null;
                try {
                    BABYLON.SceneLoader.AppendAsync("", projectFile, scene).then(() => {
                        loadTextures(scene.materials);
                        processNodes(scene);
                    });
                }
                catch (error) {
                    EditorUtils.showErrorMsg(error);
                }
            }

            editor.states.setShowStartupModal(false);
        });

        const loadTextures = (materials) => {


            materials.forEach((mat, index) => {


                if (mat.albedoTexture && mat.albedoTexture.metadata) {
                    const sourceFilename = mat.albedoTexture.metadata.source;
                    const filePath = ProjectManager.getFilePath(ProjectManager.getTexturesDirectory(), sourceFilename);
                    FileManager.readFile(filePath, (data) => {
                        // if (err) {
                        //     console.error('Erreur lors de la lecture du fichier :', err);
                        //     return;
                        // }
                        const url = Utils.convertImgToBase64URL(data, 'png');

                        // Ajout de la texture au projet
                        const texture = new BABYLON.Texture(url, scene, { invertY: false });
                        texture.name = sourceFilename;
                        if (!AssetsManager.textures.has(sourceFilename)) {
                            AssetsManager.textures.set(sourceFilename, texture);
                        }
                        mat.albedoTexture.name += ' (old)';
                        // Enlever l'anciene texture
                        mat.albedoTexture.dispose();

                        mat.albedoTexture = AssetsManager.textures.get(sourceFilename);

                    });
                }

            });

            //const sourceFilename = materials[0].getActiveTextures()[0].metadata.source;

            console.log(materials);
        }


        // materials.forEach((material) => {
        //     AssetsManager.addMaterial(material);
        //     if(material.albedoTexture){
        //         AssetsManager.textures.set(material.albedoTexture.name,material.albedoTexture);
        //         AssetsManager.textures.forEach(()=>{
        //         });
        //     }
        // });
        console.log(AssetsManager._materials);
        console.log(AssetsManager.textures);

        const processNodes = (scene: BABYLON.Scene) => {

            //0 : source, 1 : destinationID
            let goLinks: [number, number][] = []

            // index 0 : l'id orginal, l'id du gameObject lié à l'original 
            let converted: Map<number, number> = new Map<number, number>();


            scene.getNodes().forEach((node: BABYLON.Node) => {

                const nodeData = node.metadata;

                if (nodeData?.type) {

                    //component
                    if (nodeData.components) {
                        nodeData.components.forEach(component => {
                            if (component.type == Collider.name) {
                                const collGo = GameObject.buildFromTransformNode(node);
                                collGo.addComponent(new BoxCollider(collGo), "BoxCollider");
                            }
                        });
                    }

                    if (node.metadata.type === Model3D.name) {

                        const model3d: Model3D = Model3D.createEmptyFromNodeData(node);

                    } else if (node.metadata.type === ProgrammableGameObject.TYPE_NAME) {

                        const pgo = ProgrammableGameObject.createEmptyFromNodeData(node);

                        //FSM
                        node.metadata.finiteStateMachines.forEach((fsmData, index) => {
                            const fsm = pgo.finiteStateMachines[index];
                            fsm.name = fsmData.name;

                            fsmData.states.forEach((stateData, index) => {
                                const state = fsm.states[index];
                                if (stateData.statefile.name) {
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

            const defaultMat = scene.getMaterialById("default material");

            scene.meshes.forEach((mesh: BABYLON.Mesh) => {
                //Replace missing materials
                const subMaterials = mesh.material!.subMaterials;
                if (subMaterials) {
                    
                    subMaterials.forEach((subMat,index) => {
                        //alert(subMat+'  ===>'+mesh.material!.name);
                        if(!subMat){
                            mesh.material.subMaterials[index] = defaultMat;
                        }
                    });
                }
            });

            // goLinks.forEach(el => {

            //     let source = scene.getTransformNodeByUniqueId(el[0]);
            //     if (!source) {
            //         source = scene.getMeshByUniqueId(el[0]);
            //     }
            //     const target = scene.getTransformNodeByUniqueId(el[1]);
            //     if (target && source) {
            //         source.parent = target;
            //     }
            //     //console.log('-------------------');

            // });

            console.log(GameObject.gameObjects);
            editor.setupBaseScene();
            editor.updateObjectsTreeView();
            GameLoader.onLevelLoaded.notifyObservers(scene);
        }

    }

}