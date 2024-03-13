import { AbstractMesh, Observable, SceneLoader } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Material, MultiMaterial, PBRMaterial, PBRMetallicRoughnessMaterial, StandardMaterial } from "babylonjs";
import EditorUtils from "@renderer/editor/EditorUtils";
import AssetsManager from "@renderer/editor/AssetsManager";
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
    static createEmptyFromNodeData(node: BABYLON.TransformNode, scene: BABYLON.Scene): Model3D {

        const model3d = new Model3D({ scene: scene });
        model3d.name = node.name;
        // model3d.uniqueId = node.metadata.gameObjectId;
        return model3d
    }

    private constructor(arg: { scene: BABYLON.Scene });
    private constructor(arg: { directoryOrUrl: string, filename: string, options: any, scene: BABYLON.Scene });


    private constructor(arg: { directoryOrUrl: string, filename: string, options: any, scene: BABYLON.Scene }) {

        super("Modèle 3D", arg.scene);

        this.type = "Model3D";

        if (arg.directoryOrUrl && arg.filename) {
            // Regarder l'extension du modèle
            const extension = arg.filename.split(".")[arg.filename.split(".").length - 1];
            if (extension !== "fbx") {
                //SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "aerobatic_plane.glb", scene, (meshes) => {
                const mesh = SceneLoader.ImportMesh("", arg.directoryOrUrl + '/', arg.filename, arg.scene, (meshes) => {

                    const materialsToDispose: AbstractMaterial[] = [];
                    const materialsSceneNames = [];
                    arg.scene.materials.forEach((mat: AbstractMaterial) => {
                        if(mat.albedoTexture) {
                            AssetsManager.textures.set(mat.albedoTexture.name, mat.albedoTexture);
                        }
                        const last = materialsSceneNames.push(mat.name);
                    });
                    console.log(AssetsManager.textures);

                    const mat = new StandardMaterial("test2",this.scene);
                    //mat.diffuseColor = BABYLON.Color3.Red();
                    mat.diffuseTexture = AssetsManager.textures.get("Texture_Strada.png");
                    this.scene.getMeshByUniqueId(85).material = mat;
                    

//---------------------------------------------------
                    // Fusionner tous les maillages individuels en un seul maillage
                    //const mergedMesh = BABYLON.Mesh.MergeMeshes(meshes[0].getChildMeshes(), true, true, undefined, false, true);
                    //enlever le mesh root "__root__"
                    // if (extension === "glb") {
                    //     meshes[0].dispose();
                    // }

                    //const multiMaterial = mergedMesh.material as MultiMaterial;

                    // si le material existe déjà dans le projet remplacer par celui ci

                    //multiMaterial.subMaterials.forEach((subMat, index) => {



                        //multiMaterial.subMaterials[0] = new StandardMaterial(subMat.name+" standard", this.scene);

                        // if (materialsSceneNames.includes(subMat.name)) {
                        //     const replaceMat = EditorUtils.showMsgDialog({
                        //         message: `Le matériel nommé ${subMat.name} existe déjà dans le projet. Voulez vous l'utilisez pour ce modèle ?`,
                        //         type: 'warning',
                        //         buttons: ['Oui', 'Non faire une copie'],
                        //         defaultId: 0,
                        //         title: "",
                        //     });

                            // if (replaceMat == 0) {
                            //     // findIndex pour trouver l'indice du matériau à partir du nom
                            //     const materialIndex = arg.scene.materials.findIndex(mat => mat.name === subMat.name);
                            //     // ajoute les materiaux actuelles à la site de suppression avant affectation
                            //     materialsToDispose.push(subMat!.uniqueId);

                            //     //multiMaterial.subMaterials[index] = arg.scene.materials[materialIndex];
                                
                            //     multiMaterial.subMaterials[0].diffuseTexture = arg.scene.materials[1].albedoTexture;
                            //     //test
                            // }
                        //}


                    //});

                    //mergedMesh.setParent(this);

                    materialsToDispose.forEach((mat) => {
                        arg.scene.getMaterialByUniqueID(mat)!.dispose();
                    })

                    this.onLoaded.notifyObservers(this);


                });
            } else {


                SceneLoader.ImportMesh(null, arg.directoryOrUrl + '/', arg.filename, arg.scene, (meshes, [], [], [], transformNodes) => {

                    try {
                        let nodes: Array<{}> = new Array<{ 'node': null, 'name': '', 'parent': null }>();



                        // const origMatTexture = meshes[0].material.diffuseTexture;
                        // const pbr = new BABYLON.PBRMaterial("pbr", scene);
                        // pbr.metallic = 0;
                        // pbr.roughness = 1.0;
                        // pbr.albedoTexture = origMatTexture;
                        meshes.forEach((mesh: AbstractMesh) => {

                            if (mesh.material) {
                                // const materialName = mesh.material.name;
                                // let existingMat = Model3D.materials.get(materialName);

                                // if (!existingMat) {
                                //     // Créer un nouveau matériau si aucun matériau n'a encore été créé pour ce nom
                                //     existingMat = mesh.material.clone(materialName);
                                //     Model3D.materials.set(materialName, existingMat);
                                // } else {
                                //    mesh.material.dispose();
                                // }

                                // // Lier le mesh au matériau correspondant
                                // mesh.material = existingMat;
                                // //mesh.material = material;

                                // //mesh.material = pbr; // appliquer le matériau au premier noeud du modèle
                            }

                            if (!mesh.parent) {
                                mesh.setParent(this);
                            }


                        });

                        for (let index = 0; index < transformNodes.length; index++) {
                            const element = transformNodes[index];
                            //console.log(element.name);
                            nodes.push({
                                'node': element,
                                'parent': element.parent,
                                'name': element.name
                            });
                            if (element.parent) {
                                element.setParent(nodes[index].parent);
                            } else {
                                element.setParent(this);
                            }
                        }

                        // Déclenchement de l'événement
                        this.onLoaded.notifyObservers(this);
                    } catch (error) {
                        console.error(error);
                    }

                });
            }
        } else {
        }


    }

    deserialize(): void {

    }

}

