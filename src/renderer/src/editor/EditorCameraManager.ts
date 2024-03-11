import Editor from "@renderer/components/Editor";

export default class EditorCameraManager {

    constructor(canvas, scene,rendererCamera : BABYLON.Camera) {

        // Créer une caméra orthographique
        const orthoCamera = new BABYLON.FreeCamera('_EDITOR_ORTHO_CAM', new BABYLON.Vector3(0, 0, -10), scene);
        orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;


        canvas.addEventListener("keydown", (event) => {
            if (event.code === 'Numpad8') {
                
                // Calculer le zoom en fonction de la taille de l'objet
                scene.activeCamera = orthoCamera;
                
                console.log(Editor.getInstance().selectedGameObject!.getChildren()[0].getBoundingInfo());
                const boundingBox = Editor.getInstance().selectedGameObject!.getChildren()[0].getBoundingInfo().boundingBox;
                const size = boundingBox.maximum.subtract(boundingBox.minimum);
                const objectSize = Math.max(size.x, size.y, size.z);

                // Ajuster le zoom en fonction de la taille de l'objet
                orthoCamera.zoomLevel = objectSize;
            }else if(event.code === 'Numpad5') {
                scene.activeCamera = rendererCamera;
            }
        });
    }
}