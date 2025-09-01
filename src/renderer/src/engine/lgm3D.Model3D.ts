import { AbstractMesh, Observable, SceneLoader } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { MultiMaterial } from "babylonjs";
import EditorUtils from "@renderer/editor/EditorUtils";
import ProjectManager from "@renderer/editor/ProjectManager";
export class Model3D extends GameObject {

    // event lorsqu'on clic sur le model3D

    static materials: Map<string, BABYLON.Material> = new Map<string, BABYLON.Material>();

    onLoaded = new Observable<Model3D>(); // Observable pour l'événement

    static createFromModel(modelsDirectory: string, filename: string, options: null, scene: BABYLON.Scene): Model3D {
        return new Model3D({
            directoryOrUrl: modelsDirectory,
            filename: filename,
            options: options,
            scene: scene
        });
    }

    // Second constructeur
    static createEmptyFromNodeData(node: BABYLON.TransformNode): Model3D {
        console.warn(node.metadata);
        const model3d = new Model3D({ scene: node.getScene(), node });

        // if (model3d.transform && !model3d.transform.isDisposed()) {
        //     // pas d'enfants => doNotRecurse = true pour éviter toute surprise
        //     model3d.transform.dispose(true);
        // }
        // GameObject.gameObjects.delete(model3d.Id);
        // model3d._transform = node;
        // const goId = meta?.gameObjectId ?? node.metadata?.gameObjectId;
        // if (goId) {
        //     model3d.setUId(goId, true);
        // }
        // model3d.metadata = meta;
        // model3d.name = node.name;

        return model3d;
    }

    private _getAllMaterials(meshes: BABYLON.AbstractMesh[]): BABYLON.Material {
        // Récupérer tous les matériaux utilisés
        const materials = new Set<BABYLON.Material>();
        for (const m of meshes) {
            if (m.material) {
                materials.add(m.material);
            }
            // si le mesh est un container type TransformNode, descendre dans ses enfants
            m.getChildMeshes().forEach(child => {
                if (child.material) materials.add(child.material);
            });
        }
        return Array.from(materials);
    }

    // Utilitaire: récupère tous les matériaux référencés par une liste de meshes (et leurs enfants)
    _getAllMaterialsFromMeshes(meshes: BABYLON.AbstractMesh[]): Set<BABYLON.Material> {
        const set = new Set<BABYLON.Material>();
        const all: BABYLON.AbstractMesh[] = [];

        for (const m of meshes) {
            all.push(m);
            m.getChildMeshes(false).forEach(c => all.push(c));
        }

        for (const m of all) {
            const mat = m.material;
            if (!mat) continue;
            if (mat instanceof BABYLON.MultiMaterial) {
                for (const sm of mat.subMaterials) if (sm) set.add(sm);
            } else {
                set.add(mat);
            }
        }
        return set;
    }

    // Utilitaire: remplace par nom, y compris à l'intérieur des MultiMaterial
    _reassignMaterialByName(
        meshes: BABYLON.AbstractMesh[],
        materialName: string,
        replacement: BABYLON.Material,
        materialsToDispose: Set<BABYLON.Material>
    ) {
        const all: BABYLON.AbstractMesh[] = [];
        for (const m of meshes) {
            all.push(m);
            m.getChildMeshes(false).forEach(c => all.push(c));
        }

        for (const mesh of all) {
            const mat = mesh.material;
            if (!mat) continue;

            if (mat instanceof BABYLON.MultiMaterial) {
                let changed = false;
                const subs = mat.subMaterials.slice();
                for (let i = 0; i < subs.length; i++) {
                    const sm = subs[i];
                    if (sm && sm.name === materialName && sm !== replacement) {
                        materialsToDispose.add(sm);     // l’ancien sub-material sera supprimé après
                        subs[i] = replacement;
                        changed = true;
                    }
                }
                if (changed) {
                    mat.subMaterials = subs;
                }
            } else if (mat.name === materialName && mat !== replacement) {
                materialsToDispose.add(mat);        // l’ancien sera supprimé après
                mesh.material = replacement;        // ✅ le bon assign
            }
        }
    }

    private constructor(arg: { scene: BABYLON.Scene, node?: BABYLON.TransformNode });
    private constructor(arg: { directoryOrUrl: string, filename: string, options: any, scene: BABYLON.Scene });
    private constructor(arg) {

        super("Modèle 3D", arg.scene, arg.node);
        this.type = "Model3D";

        let directoryOrUrl = arg.directoryOrUrl;
        let filename = arg.filename;
        if (arg.node) {
            console.warn(arg.node.metadata);
            filename = arg.node.metadata.sourceFile;
            directoryOrUrl = ProjectManager.getModelsDirectory();
        } else {
            this.metadata["sourceFile"] = arg.filename;
        }

        // Regarder l'extension du modèle
        const extension = filename.split(".")[filename.split(".").length - 1];
        if (extension === "glb" || extension === "gltf") {

            const mesh = SceneLoader.ImportMesh("", directoryOrUrl + '/', filename, arg.scene, (meshes) => {

                if (meshes[0].name !== "__root__") {
                    console.error("GLB root node not found");
                    return;
                }
                const materialsSceneNames = [];

                // TODO : Recupérer plutôt la liste des Materiaux dans le AssetManager
                arg.scene.materials.forEach((mat: AbstractMaterial) => {
                    const last = materialsSceneNames.push(mat.name);
                });

                const materialsToDispose = new Set<BABYLON.Material>();
                const importedMats = this._getAllMaterialsFromMeshes(meshes);

                importedMats.forEach(mat => {
                    const originalName = mat.name;
                    if (!materialsSceneNames.includes(originalName)) return;

                    const replaceMat = EditorUtils.showMsgDialog({
                        message: `Le matériel nommé ${originalName} existe déjà dans le projet. Voulez-vous l'utiliser pour ce modèle ?`,
                        type: 'warning',
                        buttons: ['Ajouter le materiel du modèle au projet', 'Réutiliser celui du projet'],
                        defaultId: 0,
                        title: "Conflits de matériaux",
                    });

                    if (replaceMat === 1) {
                        const existing = arg.scene.getMaterialByName(originalName);
                        if (existing && existing !== mat) {
                            // (Optionnel) marquer visuellement l’importé pour debug
                            // mat.name = `${originalName}__toRemove`;

                            // Remapper partout où ce nom apparaît (y compris MultiMaterial)
                            this._reassignMaterialByName(meshes, originalName, existing, materialsToDispose);
                        }
                    } else {
                        mat.name = this._getUniqueMaterialName(arg.scene, originalName);
                    }
                });

                // Après remap, on peut supprimer en sécurité les anciens matériaux
                materialsToDispose.forEach(m => {
                    // Double-check: ne supprimer que s’il n’est plus utilisé
                    const stillUsed = arg.scene.meshes.some(me => {
                        if (me.material === m) return true;
                        if (me.material instanceof BABYLON.MultiMaterial) {
                            return me.material.subMaterials.some(sm => sm === m);
                        }
                        return false;
                    });
                    if (!stillUsed) {
                        m.dispose(true, true);
                    }
                });


                //---------------------------------------------------
                // Fusionner tous les maillages individuels en un seul maillage
                //const mergedMesh = BABYLON.Mesh.MergeMeshes(meshes[0].getChildMeshes(), true, true, undefined, false, true);
                meshes[0].getChildren(undefined, true).forEach((node: BABYLON.Node) => {
                    node.parent = this._transform;
                });

                //enlever le mesh root "__root__"
                meshes[0].dispose();

                // const multiMaterial = mergedMesh.material as MultiMaterial;
                // // si le material existe déjà dans le projet remplacer par celui ci
                // multiMaterial.subMaterials.forEach((subMat, index) => {

                //     if (materialsSceneNames.includes(subMat.name)) {
                //         const replaceMat = EditorUtils.showMsgDialog({
                //             message: `Le matériel nommé ${subMat.name} existe déjà dans le projet. Voulez vous l'utilisez pour ce modèle ?`,
                //             type: 'warning',
                //             buttons: ['Oui', 'Non faire une copie'],
                //             defaultId: 0,
                //             title: "",
                //         });

                //         if (replaceMat == 0) {
                //             // findIndex pour trouver l'indice du matériau à partir du nom
                //             const materialIndex = arg.scene.materials.findIndex(mat => mat.name === subMat.name);
                //             // ajoute les materiaux actuelles à la site de suppression avant affectation
                //             materialsToDispose.push(subMat!.uniqueId);

                //             multiMaterial.subMaterials[index] = arg.scene.materials[materialIndex];

                //         }
                //     }
                // });

                //mergedMesh!.setParent(this.transform);
                materialsToDispose.forEach((mat) => {
                    console.log(mat);
                    //arg.scene.getMaterialByUniqueID(mat)!.dispose();
                })
                this.onLoaded.notifyObservers(this);

            }, (onProgress) => {

            }, (error) => {
                console.error(error);
            });
        }



    }

    private _getUniqueMaterialName(scene: BABYLON.Scene, baseName: string): string {
        let name = baseName;
        let i = 1;
        while (scene.getMaterialByName(name)) {
            name = `${baseName}_${i++}`;
        }
        return name;
    }


    deserialize(): void {

    }

}

