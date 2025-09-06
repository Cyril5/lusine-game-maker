import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/lgm3D.FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/lgm3D.Model3D";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import StateEditorUtils from "./StateEditorUtils";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import AssetsManager from "../engine/lgm3D.AssetsManager";
import { Material, Observable } from "babylonjs";
import Utils from "@renderer/engine/utils/lgm3D.Utils";
import LGM3DEditor from "./LGM3DEditor";
import { SceneSerializer } from "@babylonjs/core";
import "@babylonjs/serializers";
import { Rigidbody } from "@renderer/engine/physics/lgm3D.Rigidbody";
import { FiniteStateMachine } from "@renderer/engine/FSM/lgm3D.FiniteStateMachine";
import { copyTexProps, loadMaterialTexturesFromMetadata, rebindMaterialsFromMetadataAndCleanup } from "@renderer/engine/utils/MaterialUtils";

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
        console.log(serializedScene.meshes);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement

        //Enlever les transformNodes de l'editeur
        const editorNodes = serializedScene.transformNodes as any[];
        const meshes = serializedScene.meshes as any[];
        const materialsJSON = serializedScene.materials as any[];

        // Supprime récursivement toute clé "base64String" du JSON sérialisé
        const stripAllBase64 = (obj: any) => {
            if (!obj || typeof obj !== "object") return;
            if (Array.isArray(obj)) {
                for (const it of obj) stripAllBase64(it);
                return;
            }
            if ("base64String" in obj) {
                delete obj.base64String; // ← on supprime complètement la clé
            }
            for (const k of Object.keys(obj)) {
                stripAllBase64(obj[k]);
            }
        }

        stripAllBase64(serializedScene);

        [editorNodes, meshes, materialsJSON, serializedScene.cameras].forEach((arr, index) => {
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
                        // if (!scene.environmentTexture) {
                        //     const env = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/environment.env", scene);
                        //     scene.environmentTexture = env;
                        //     scene.createDefaultSkybox(env, true, 1000);
                        // }
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

            rebindMaterialsFromMetadataAndCleanup(scene.materials, scene);

            // materials.forEach((mat, index) => {
            //     if (mat.albedoTexture && mat.albedoTexture.metadata) {
            //         const sourceFilename = mat.albedoTexture.metadata.sourceImg;
            //         if (!sourceFilename)
            //             return;
            //         const filePath = ProjectManager.getFilePath(AssetsManager.getTexturesDirectory(), sourceFilename);
            //         FileManager.readFile(filePath, (data) => {
            //             // if (err) {
            //             //     console.error('Erreur lors de la lecture du fichier :', err);
            //             //     return;
            //             // }
            //             const url = Utils.convertImgToBase64URL(data, 'png');

            //             // Ajout de la texture au projet
            //             const texture = new BABYLON.Texture(url, scene, { invertY: false });
            //             texture.name = sourceFilename;
            //             if (!AssetsManager.textures.has(sourceFilename)) {
            //                 AssetsManager.textures.set(sourceFilename, texture);
            //             }
            //             mat.albedoTexture.name += ' (old)';
            //             // Enlever l'anciene texture
            //             mat.albedoTexture.dispose();

            //             mat.albedoTexture = AssetsManager.textures.get(sourceFilename);

            //         });
            //     }
            // });

            //const sourceFilename = materials[0].getActiveTextures()[0].metadata.source;
        }


        // materials.forEach((material) => {
        //     AssetsManager.addMaterial(material);
        //     if(material.albedoTexture){
        //         AssetsManager.textures.set(material.albedoTexture.name,material.albedoTexture);
        //         AssetsManager.textures.forEach(()=>{
        //         });
        //     }
        // });
        // console.log(AssetsManager._materials);
        // console.log(AssetsManager.textures);

        const processNodes = (scene: BABYLON.Scene) => {

            //0 : source, 1 : destinationID
            let goLinks: [number, number][] = []

            // index 0 : l'id orginal, l'id du gameObject lié à l'original 
            let converted: Map<number, number> = new Map<number, number>();


            scene.getNodes().forEach((node: BABYLON.Node) => {

                let goCreated = false;

                const nodeData = node.metadata;
                if (!nodeData) {
                    return;
                }
                let go: GameObject | null = null;

                if (nodeData?.type) {

                    if (node.metadata.type === Model3D.name) {
                        const model3d: Model3D = Model3D.createEmptyFromNodeData(node);
                        console.log(nodeData);
                        if (nodeData.parentId) {
                            console.log("Put : " + nodeData.gameObjectId);
                            goLinks.push([nodeData.gameObjectId, nodeData.parentId]);
                        }
                    }
                } else {

                }
                if (nodeData?.gameObjectId) {

                    go = GameObject.createFromTransformNodeMetaData(node, scene);
                    if (nodeData.parentId) {
                        goLinks.push([nodeData.gameObjectId, nodeData.parentId]);
                    }
                    goCreated = true;

                    //FSM
                    node.metadata.finiteStateMachines?.forEach((fsmData, index) => {
                        const fsm = go?.addComponent("FiniteStateMachine" + index, new FiniteStateMachine(go!));
                        fsm!.name = fsmData.name;
                        fsmData.states.forEach((stateData, index) => {
                            const state = fsm.states[index];
                            if (stateData.statefile?.name) {
                                state.stateFile = StateEditorUtils.getStateFile(stateData.statefile.name);
                            }
                        });
                    });
                }
                if (nodeData.components) {
                    nodeData.components.forEach(component => {
                        if (component.type == Utils.BX_COLLIDER_COMPONENT_TYPE) {
                            const bxcol = go!.addComponent(Utils.BX_COLLIDER_COMPONENT_TYPE, new BoxCollider(go!)) as BoxCollider;
                            if (component.isTrigger)
                                bxcol.isTrigger = component.isTrigger;
                        } else if (component.type == Utils.RB_COMPONENT_TYPE) {
                            go!.addComponent(Utils.RB_COMPONENT_TYPE, new Rigidbody(go!, go!.scene, BABYLON.PhysicsMotionType.DYNAMIC, 1));
                        }
                    });
                }
            });

            const defaultMat = scene.getMaterialById("default material");

            scene.meshes.forEach((mesh: BABYLON.Mesh) => {
                //Replace missing materials
                if (!mesh.material) {
                    return;
                }

                const subMaterials = mesh.material!.subMaterials;
                if (subMaterials) {

                    subMaterials.forEach((subMat, index) => {
                        //alert(subMat+'  ===>'+mesh.material!.name);
                        if (!subMat) {
                            mesh.material.subMaterials[index] = defaultMat;
                        }
                    });
                }
            });

            goLinks.forEach(el => {
                let source = GameObject.getById(el[0]);
                const target = GameObject.getById(el[1]);
                if (target && source) {
                    console.log(`parent ${source.name} : ${source.Id} to => ${target.name} : ${target.Id}`);
                    source.setParent(target);
                }
            });

            console.log(GameObject.gameObjects);
            editor.setupBaseScene();
            editor.updateObjectsTreeView();
            GameLoader.onLevelLoaded.notifyObservers(scene);
        }

    }

    // ─── Méthode principale ─────────────────────────────────────────────────────
    static sanitizeMaterialForSave(mat: BABYLON.Material | any): void {

        // ─── Helpers ────────────────────────────────────────────────────────────────
        function _toNoExt(relPath: string): string {
            const p = FileManager.path;
            const norm = relPath.replace(/\\/g, "/");                 // URL-friendly
            return norm.slice(0, norm.length - p.extname(norm).length);
        }

        function _wipeTex(t?: BABYLON.BaseTexture | null) {
            if (!t) return;
            const any = t as any;
            //if ("url" in any) any.url = null;
            if ("base64String" in any) any.base64String = null;
        }

        function _applyNameFromMetaNoExt(t?: BABYLON.BaseTexture | null, relWithExt?: string) {
            if (!t || !relWithExt) return;
            t.name = _toNoExt(relWithExt); // ex: "Models/MyModel/texture0"
        }

        // Détection de type sans dépendre d'instanceof/getClassName.
        function _kindOfMaterial(mat: any): "pbr" | "standard" | "multi" | "node" | "unknown" {
            const cn = mat?.getClassName?.();
            if (typeof cn === "string") {
                const k = cn.toLowerCase();
                if (k.includes("pbr")) return "pbr";
                if (k.includes("standard")) return "standard";
                if (k.includes("multi")) return "multi";
                if (k.includes("node")) return "node";
            }
            if (mat?.subMaterials) return "multi";
            if ("albedoTexture" in (mat || {})) return "pbr";
            if ("diffuseTexture" in (mat || {})) return "standard";
            return "unknown";
        }

        if (!mat) return;

        // Si c'est un MultiMaterial : traiter récursivement.
        if (_kindOfMaterial(mat) === "multi") {
            for (const sm of (mat.subMaterials as BABYLON.Material[] | undefined) || []) {
                if (sm) GameLoader.sanitizeMaterialForSave(sm);
            }
            return;
        }

        // Chemins (avec extension) attendus dans mat.metadata.textures.*
        const texMeta: Record<string, string> | undefined = (mat.metadata as any)?.textures;
        return;
        switch (_kindOfMaterial(mat)) {
            case "pbr": {
                const m = mat as BABYLON.PBRMaterial;

                // Albedo / BaseColor
                _wipeTex(m.albedoTexture);
                _applyNameFromMetaNoExt(m.albedoTexture, texMeta?.albedo);

                // Normal / Bump
                const n = (m.normalTexture ?? m.bumpTexture) as BABYLON.BaseTexture | null;
                _wipeTex(n);
                _applyNameFromMetaNoExt(n, texMeta?.normal);

                // MetallicRoughness (ORM)
                _wipeTex(m.metallicTexture);
                _applyNameFromMetaNoExt(m.metallicTexture, texMeta?.metallicRoughness);

                // AO / Emissive / Opacity / Reflection / Lightmap (si présents en metadata)
                _wipeTex(m.ambientTexture);
                _applyNameFromMetaNoExt(m.ambientTexture, texMeta?.occlusion);

                _wipeTex(m.emissiveTexture);
                _applyNameFromMetaNoExt(m.emissiveTexture, texMeta?.emissive);

                _wipeTex(m.opacityTexture);
                _applyNameFromMetaNoExt(m.opacityTexture, texMeta?.opacity);

                _wipeTex(m.reflectionTexture);
                _applyNameFromMetaNoExt(m.reflectionTexture, texMeta?.reflection);

                _wipeTex(m.lightmapTexture);
                _applyNameFromMetaNoExt(m.lightmapTexture, texMeta?.lightmap);
                break;
            }

            case "standard": {
                const m = mat as BABYLON.StandardMaterial;

                _wipeTex(m.diffuseTexture);
                _applyNameFromMetaNoExt(m.diffuseTexture, texMeta?.diffuse ?? texMeta?.albedo);

                _wipeTex(m.bumpTexture);
                _applyNameFromMetaNoExt(m.bumpTexture, texMeta?.normal ?? texMeta?.bump);

                _wipeTex(m.specularTexture);
                _applyNameFromMetaNoExt(m.specularTexture, texMeta?.specular);

                _wipeTex(m.emissiveTexture);
                _applyNameFromMetaNoExt(m.emissiveTexture, texMeta?.emissive);

                _wipeTex(m.opacityTexture);
                _applyNameFromMetaNoExt(m.opacityTexture, texMeta?.opacity);

                _wipeTex(m.ambientTexture);
                _applyNameFromMetaNoExt(m.ambientTexture, texMeta?.ambient ?? texMeta?.occlusion);

                _wipeTex(m.reflectionTexture);
                _applyNameFromMetaNoExt(m.reflectionTexture, texMeta?.reflection);

                _wipeTex(m.refractionTexture);
                _applyNameFromMetaNoExt(m.refractionTexture, texMeta?.refraction);
                break;
            }

            default: {
                // Matériaux non gérés (NodeMaterial, custom…) : on allège sans renommer.
                const keys = [
                    "albedoTexture", "baseTexture", "diffuseTexture", "normalTexture", "bumpTexture",
                    "metallicTexture", "roughnessTexture", "ambientTexture", "emissiveTexture",
                    "opacityTexture", "reflectionTexture", "lightmapTexture", "specularTexture",
                    "refractionTexture"
                ] as const;
                for (const k of keys) _wipeTex((mat as any)[k]);
                break;
            }
        }
    }


}