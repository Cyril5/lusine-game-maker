import { AbstractMesh, Observable, SceneLoader } from "@babylonjs/core";
import { GameObject } from "./GameObject";
export class Model3D extends GameObject {


    
    // event lorsqu'on clic sur le model3D
    
    static materials: Map<string, BABYLON.Material> = new Map<string, BABYLON.Material>();
    
    onLoaded = new Observable<Model3D>(); // Observable pour l'événement
    
    static createFromModel(modelsDirectory: string, filename: string, options: null, scene: BABYLON.Scene) : Model3D {
        return new Model3D({
            directoryOrUrl:modelsDirectory,
            filename:filename,
            options:options,
            scene:scene
        });
    }

    // Second constructeur
    static createEmptyFromNodeData(node : BABYLON.TransformNode,scene : BABYLON.Scene) : Model3D {
        
        const model3d =  new Model3D({scene:scene});
        model3d.name = node.name;
       // model3d.uniqueId = node.metadata.gameObjectId;
        return model3d
    }

    private constructor(arg : {scene : BABYLON.Scene});
    private constructor(arg : {directoryOrUrl: string, filename : string, options : any, scene : BABYLON.Scene});


    private constructor(arg : {directoryOrUrl : string, filename : string , options : any, scene : BABYLON.Scene}) {

        super("Modèle 3D", arg.scene);

        this.type = "Model3D";

        if(arg.directoryOrUrl && arg.filename) {
            // Regarder l'extension du modèle
            const extension = arg.filename.split(".")[arg.filename.split(".").length - 1];
            if (extension !== "fbx") {
                //SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "aerobatic_plane.glb", scene, (meshes) => {
                const mesh = SceneLoader.ImportMesh("", arg.directoryOrUrl+'/', arg.filename, arg.scene, (meshes) => {
    
                         // Fusionner tous les maillages individuels en un seul maillage
                        const mergedMesh = BABYLON.Mesh.MergeMeshes(meshes[0].getChildMeshes(), true, true, undefined, false, true);
                        //enlever le mesh root "__root__"
                        if(extension === "glb") {
                            meshes[0].dispose();
                        }
                        mergedMesh.setParent(this);
                    //test.freezeWorldMatrix();
                    //scene.freezeActiveMeshes();
    
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
    
                            if(mesh.material) {
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
    
                            if(!mesh.parent) {
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
        }
   

    }

    deserialize(): void {
        
    }

}

