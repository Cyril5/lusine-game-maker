import { Scene, SceneLoader } from "@babylonjs/core";
import { GameObject } from "./GameObject";

export class Model3D extends GameObject {


    constructor(directoryOrUrl: string, filename: string,options=null, scene: Scene) {
        super("Modèle 3D", scene);

        // Regarder l'extension du modèle
        const extension = filename.split(".")[filename.split(".").length - 1];
        if (extension !== "fbx") {
            //SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "aerobatic_plane.glb", scene, (meshes) => {
            const mesh = SceneLoader.ImportMesh("", directoryOrUrl, filename, scene, (meshes) => {

                console.log(meshes);
                // const plane = scene.getNodeByName("aerobatic_plane.2");
                // plane.parent = null;
                // const propellor = scene.getNodeByName("Propellor_Joint.9");
                // propellor.parent = plane;

                meshes[0].parent = this.transform;

                // this._scene.getNodeById("__root__")?.dispose();

            });
        }else{
            SceneLoader.ImportMesh(null, directoryOrUrl+'/', filename, scene, (meshes)=>{

                console.log(meshes[0].parent.name);
                meshes[0].parent.parent = this.transform;
            });
        }



    }
}