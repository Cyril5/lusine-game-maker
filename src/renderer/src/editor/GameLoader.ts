import ProjectManager from "./ProjectManager";
import FileManager from "@renderer/engine/lgm3D.FileManager";
import EditorUtils from "./EditorUtils";
import { GameObject } from "@renderer/engine/GameObject";
import { Model3D } from "@renderer/engine/lgm3D.Model3D";
import StateEditorUtils from "./StateEditorUtils";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import Utils from "@renderer/engine/utils/lgm3D.Utils";
import LGM3DEditor from "./LGM3DEditor";

// ESM uniquement
import { Observable, Scene } from "@babylonjs/core";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";   // plugin .babylon
import "@babylonjs/core/Materials/standardMaterial";          // Standard
import "@babylonjs/core/Materials/PBR/pbrMaterial";           // PBR
import "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial"; // pour __GLTFLoader._default si présent
//import "@babylonjs/serializers";

import { Rigidbody } from "@renderer/engine/physics/lgm3D.Rigidbody";
import { FiniteStateMachine } from "@renderer/engine/FSM/lgm3D.FiniteStateMachineOLD";
import { rebindMaterialsFromMetadataAndCleanup } from "@renderer/engine/utils/MaterialUtils";

import ShortUniqueId from "short-unique-id";
import { TransformsAnalyzer } from "@renderer/engine/utils/lgm3D.TransformsAnalyzer";
import AssetsManager from "@renderer/engine/lgm3D.AssetsManager";
import SphereCollider from "@renderer/engine/physics/lgm3D.SphereCollider";
import Collider from "@renderer/engine/physics/lgm3D.Collider";
const uid = new ShortUniqueId({ length: 10 });

export default abstract class GameLoader {

    private _scene: Scene;
    static onLevelLoaded: Observable<Scene> = new Observable();

    constructor(scene) {
        this._scene = scene;
        GameLoader.onLevelLoaded = new Observable();
    }

    public static saveV2(scene: BABYLON.Scene) {

        /* ───────────────────────── Helpers ───────────────────────── */

        function sanitizeRuntimeBeforeSave(scene: BABYLON.Scene) {
            // A) Détacher/retirer PostProcesses (caméras)
            for (const cam of scene.cameras) {
                const pps = (cam as any)._postProcesses?.slice() ?? [];
                for (const pp of pps) {
                    try { (cam as any).detachPostProcess(pp); } catch { }
                    try { pp.dispose?.(); } catch { }
                }
            }

            // B) Retirer les render pipelines
            try {
                const mgr: any = (scene as any).postProcessRenderPipelineManager;
                const pipelines = Object.values(mgr?._renderPipelines ?? {});
                for (const pl of pipelines as any[]) {
                    try { mgr.detachCamerasFromRenderPipeline(pl.name, scene.cameras); } catch { }
                    try { mgr.removeRenderPipeline(pl.name); } catch { }
                    try { pl.dispose?.(); } catch { }
                }
            } catch { }

            // C) Layers (Glow/Highlight)
            for (const l of (scene as any).effectLayers?.slice() ?? []) {
                try { l.dispose?.(); } catch { }
            }

            // D) Physique (en éditeur, on n’embarque rien)
            try { (scene as any).disablePhysicsEngine?.(); } catch { }

            // E) Corriger textures “fantômes” (url:null) ou invalides
            fixTextures(scene);

            // F) Dédupliquer les matériaux proprement (incl. MultiMaterial)
            autoReuseMaterialsSafe(scene);

            // G) Respecter doNotSerialize sur les helpers d’éditeur
            for (const node of scene.getNodes()) {
                if (node?.doNotSerialize) continue;
                if (typeof node.name === "string" && node.name.startsWith("_EDITOR_")) {
                    (node as any).doNotSerialize = true;
                }
            }
        }

        function fixTextures(scene: BABYLON.Scene) {
            const texProps = [
                "albedoTexture", "diffuseTexture", "emissiveTexture", "opacityTexture",
                "bumpTexture", "normalTexture", "ambientTexture", "metallicTexture", "roughnessTexture"
            ];

            for (const mat of scene.materials) {
                const anyMat = mat as any;
                for (const tname of texProps) {
                    const tex = anyMat[tname] as BABYLON.Texture | null | undefined;
                    if (tex && (tex as any).url == null) {
                        const metaUrl = mat.metadata?.textures?.[tname.replace("Texture", "")] as (string | undefined);
                        if (metaUrl && (tex as any).updateURL) {
                            try { (tex as any).updateURL(metaUrl); } catch { anyMat[tname] = null; }
                        } else {
                            anyMat[tname] = null;
                        }
                    }
                }
            }
        }

        function autoReuseMaterialsSafe(scene: BABYLON.Scene) {
            // 1) Choisir un “keeper” par nom (ou id à défaut)
            const keepByKey = new Map<string, BABYLON.Material>();
            const dups: BABYLON.Material[] = [];

            for (const mat of scene.materials) {
                // ne touche pas aux spéciaux
                if (mat.name === "__GLTFLoader._default") continue;
                const key = mat.name || mat.id;
                if (!key) continue;

                if (!keepByKey.has(key)) keepByKey.set(key, mat);
                else dups.push(mat);
            }

            if (dups.length === 0) return;

            // 2) Réassigner toutes les références (mesh.material et MultiMaterial.subMaterials)
            const reassignInMultiMaterial = (mm: BABYLON.MultiMaterial) => {
                for (let i = 0; i < mm.subMaterials.length; i++) {
                    const sm = mm.subMaterials[i];
                    if (!sm) continue;
                    const key = sm.name || sm.id;
                    const keeper = key ? keepByKey.get(key) : undefined;
                    if (keeper && keeper !== sm) mm.subMaterials[i] = keeper;
                }
            };

            for (const mesh of scene.meshes) {
                // Mat simple
                const m = mesh.material;
                if (m) {
                    const key = m.name || m.id;
                    const keeper = key ? keepByKey.get(key) : undefined;
                    if (keeper && keeper !== m) mesh.material = keeper;
                }
                // MultiMaterial éventuel
                if (mesh.material && mesh.material.getClassName?.() === "MultiMaterial") {
                    reassignInMultiMaterial(mesh.material as BABYLON.MultiMaterial);
                }
            }

            // 3) Supprimer les doublons (hors itération de scene.materials)
            for (const mat of dups) {
                try { scene.removeMaterial?.(mat); } catch { }
                try { mat.dispose(); } catch { }
            }
        }

        function postSanitizeSerializedJSON(data: any) {
            // A) Pas d’envMap dans le .lgm d’éditeur
            data.environmentTexture = null;

            // B) Vider postFX/pipelines/layers et cam.postProcesses
            data.postprocesses = [];
            data.postProcessRenderPipelines = [];
            data.layers = [];
            if (Array.isArray(data.cameras)) {
                for (const c of data.cameras) c.postProcesses = [];
            }

            // C) Physique off et champs supprimés
            data.physicsEnabled = false;
            delete data.physicsEngine;
            delete data.physicsGravity;

            // D) Retirer tous les plugins de matériaux (sécurité)
            if (Array.isArray(data.materials)) {
                for (const m of data.materials) delete m.plugins;
            }

            // E) Enlever base64 et labels internes partout
            (function strip(o: any) {
                if (!o || typeof o !== "object") return;
                if (Array.isArray(o)) return o.forEach(strip);
                if ("base64String" in o) delete o.base64String;
                if ("internalTextureLabel" in o) delete o.internalTextureLabel;
                for (const k of Object.keys(o)) strip(o[k]);
            })(data);

            if (data.geometries) {
                data.geometries.vertexData = [];
                data.geometries.geometries = [];
            }
        }

        console.log("[SAVE] start");

        // 1) Laisse chaque GO snapshotter ses metadata si ton moteur le fait
        try {
            // Si GameObject n'est pas accessible ici, commente cette ligne.
            GameObject.gameObjects?.forEach((go) => go.serialize?.());
        } catch (e) {
            console.warn("[SAVE] GameObject.save pass:", e);
        }

        // 2) Nettoyage runtime pour éviter d’embarquer des objets “exécution”
        sanitizeRuntimeBeforeSave(scene);

        // 3) Sérialisation
        const serialized = BABYLON.SceneSerializer.Serialize(scene);

        // 4) Post-sanitize du JSON (retraits défensifs)
        postSanitizeSerializedJSON(serialized);

        // 5) Écriture du fichier
        const out = JSON.stringify(serialized); // tu peux mettre ", null, 2" si tu veux indenter
        const filePath = ProjectManager.getFilePath("", "game.lgm");
        FileManager.writeInFile(filePath, out, () => {
            EditorUtils.showInfoMsg("Projet sauvegardé !");
            console.log("[SAVE] wrote:", filePath);
        });
    }

    public static save(scene: BABYLON.Scene) {
        console.log("saving");

        GameObject.gameObjects.forEach((gameObject) => {
            gameObject.serialize();
        });

        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        console.log(serializedScene.meshes);
        console.log((serializedScene.cameras as Array<any>).shift()); //enlever le premier élement

        //Enlever les transformNodes de l'editeur
        const editorNodes = serializedScene.transformNodes as any[];
        const meshes = serializedScene.meshes as any[];
        const materialsJSON = serializedScene.materials as any[];
        serializedScene.environmentTexture = null; // désactiver la texture d'environment


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
        // vider les vertex data de la scène
        serializedScene.geometries.vertexData = [];
        // ne pas sauvegarder le post processing car il est ajouté pour le moment automatiquement
        serializedScene.postProcesses = [];

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
                processNodes(scene);
                return;
            } else {
                editor.clearScene(scene);
                try {

                    FileManager.readFile(projectFile, async (text: string) => {
                        try {
                            // On passe FileManager pour la lecture/écriture
                            const result = await TransformsAnalyzer.appendWithTNGuards(
                                projectFile,
                                scene,
                                FileManager,
                                {
                                    forceGuidAll: false,   // → true si tu veux que TOUS les TN aient un GUID
                                    guidLength: 8,         // taille du GUID
                                    keepOriginalName: true // garder les noms d’origine pour l’UI
                                }
                            );
                            await scene.whenReadyAsync();
                            processNodes(scene);
                            rebindMaterialsFromMetadataAndCleanup(scene.materials, scene);
                            scene.materials.forEach(mat => {
                                AssetsManager.addMaterial(mat);
                            });

                            console.log("[GameLoader] Scene chargée avec succès", result);

                        } catch (err) {
                            console.error("[GameLoader] Erreur fatale de chargement", err);
                            EditorUtils.showErrorMsg?.(String(err?.message ?? err));
                        }
                    });
                }
                catch (error) {
                    console.error(error);
                    //EditorUtils.showErrorMsg(error);
                }
            }

            editor.states.setShowStartupModal(false);
        });

        const processNodes = (scene: Scene) => {

            console.log("Processing nodes...");
            editor.setupBaseScene();

            //0 : source, 1 : destinationID
            let goLinks: [number, number][] = []

            // index 0 : l'id orginal, l'id du gameObject lié à l'original 
            let converted: Map<number, number> = new Map<number, number>();


            scene.getNodes().forEach((node: Node) => {

                let goCreated = false;

                const nodeData = node.metadata;
                if (!nodeData) {
                    return;
                }
                let go: GameObject | null = null;

                if (nodeData?.type) {
                    if (node.metadata.type === Model3D.name) {
                        //return;
                        const model3d: Model3D = Model3D.createEmptyFromNodeData(node);
                        console.log(nodeData);
                        if (nodeData.parentId) {
                            console.log("Put : " + nodeData.gameObjectId);
                            goLinks.push([nodeData.gameObjectId, nodeData.parentId]);
                        }
                    }
                } else {

                }
                if (nodeData?.gameObjectId && !nodeData?.type) {

                    go = GameObject.createFromTransformNodeMetaData(node, scene);
                    if (nodeData.parentId) {
                        goLinks.push([nodeData.gameObjectId, nodeData.parentId]);
                    }
                    goCreated = true;

                    //FSM (<= Alpha 0.2.6)
                    // node.metadata.finiteStateMachines?.forEach((fsmData, index) => {
                    //     const fsm = go?.addComponent("FiniteStateMachine" + index, new FiniteStateMachine(go!));
                    //     fsm!.name = fsmData.name;
                    //     fsmData.states.forEach((stateData, index) => {
                    //         const state = fsm.states[index];
                    //         if (stateData.statefile?.name) {
                    //             state.stateFile = StateEditorUtils.getStateFile(stateData.statefile.name);
                    //         }
                    //     });
                    // });
                }
                if (nodeData.components) {
                    nodeData.components.forEach(component => {
                        if (component.type == Utils.RB_COMPONENT_TYPE || component.componentType == Utils.RB_COMPONENT_TYPE) {
                            go!.addComponent(Utils.RB_COMPONENT_TYPE, new Rigidbody(go!, go!.scene, BABYLON.PhysicsMotionType.DYNAMIC, 1));
                        }
                        let colliderComp: Collider | undefined;
                        switch (component.componentType) {
                            case Utils.SPHERE_COLL_COMPONENT_TYPE:
                                colliderComp = go!.addComponent(Utils.SPHERE_COLL_COMPONENT_TYPE, new SphereCollider(go!)) as SphereCollider;
                                break;

                            case Utils.BX_COLL_COMPONENT_TYPE:
                                colliderComp = go!.addComponent(Utils.BX_COLL_COMPONENT_TYPE, new BoxCollider(go!)) as BoxCollider;
                                break;
                            case Utils.FSM_COMPONENT_TYPE:
                                const fsmData = component.data;
                                const fsm = go?.addComponent("FiniteStateMachine", new FiniteStateMachine(go!));
                                fsm!.name = fsmData.name;
                                if(!fsmData.states) {
                                    console.error("States array is missing on data");
                                    return;
                                }
                                fsmData.states.forEach((stateData, index) => {
                                    const state = fsm.states[index];
                                    if (stateData.statefile?.name) {
                                        state.stateFile = StateEditorUtils.getStateFile(stateData.statefile.name);
                                    }
                                });
                            break;
                        }
                        if (colliderComp) colliderComp.isTrigger = component.isTrigger;
                    });
                }



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

                editor.updateObjectsTreeView();
                GameLoader.onLevelLoaded.notifyObservers(scene);
                editor.states.setShowStartupModal(false);
            });
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