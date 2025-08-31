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
        if (extension !== "fbx") {

            const mesh = SceneLoader.ImportMesh("", directoryOrUrl + '/', filename, arg.scene, (meshes) => {

                const materialsToDispose: BABYLON.AbstractMaterial[] = [];
                const materialsSceneNames = [];
                arg.scene.materials.forEach((mat: AbstractMaterial) => {
                    const last = materialsSceneNames.push(mat.name);
                });
                //---------------------------------------------------
                // Fusionner tous les maillages individuels en un seul maillage
                //const mergedMesh = BABYLON.Mesh.MergeMeshes(meshes[0].getChildMeshes(), true, true, undefined, false, true);

                meshes[0].getChildMeshes(true).forEach((child) => {
                    child.parent = this._transform;
                });

                if (extension === "glb" || extension === "gltf") {
                    //enlever le mesh root "__root__"
                    meshes[0].dispose();
                }

                //const multiMaterial = mergedMesh.material as MultiMaterial;

                // si le material existe déjà dans le projet remplacer par celui ci
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
                // materialsToDispose.forEach((mat) => {
                //     arg.scene.getMaterialByUniqueID(mat)!.dispose();
                // })
                this.onLoaded.notifyObservers(this);

            });
        }



    }

    deserialize(): void {

    }

}

