import LGM3DEditor from "./LGM3DEditor";


export default class EditorCameraManager {

    private _scene;
    private _orthoCamera;
    constructor(canvas, scene, rendererCamera: BABYLON.Camera) {

        this._scene = scene;

        // Créer une caméra orthographique
        this._orthoCamera = new BABYLON.FreeCamera('_EDITOR_ORTHO_CAM', new BABYLON.Vector3(0, 0, -10), scene);
        this._orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this._orthoCamera.doNotSerialize = true;

        let zoomFactor = 1;
        const maxZoomScale = 3;
        const minZoomSale = 0.1;

        scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                const delta = Math.sign(pointerInfo.event.deltaY);
                zoomFactor += delta * 0.1; // Ajuste le facteur de zoom
                this._orthoCamera.orthoLeft = -5 * zoomFactor; // Ajuste la taille de la vue orthographique en fonction du zoom
                this._orthoCamera.orthoRight = 5 * zoomFactor;
                this._orthoCamera.orthoTop = 5 * zoomFactor;
                this._orthoCamera.orthoBottom = -5 * zoomFactor;
            }
        });



        canvas.addEventListener("keydown", (event) => {

            const orthoCamKeys = ['Numpad2','Digit2', 'Numpad4','Digit4', 'Numpad5','Digit5', 'Numpad6','Digit6', 'Numpad8','Digit8'];

            if (orthoCamKeys.includes(event.code)) {
                this.activeOrthoCamera();
            }

            switch (event.code) {
                case 'Numpad4' || 'Digit4':
                    this._orthoCamera.position.x = 10;
                    this._orthoCamera.position.y = 0;
                    this._orthoCamera.position.z = 0;
                    this._orthoCamera.rotation.x = 0;
                    this._orthoCamera.rotation.y = -Math.PI / 2;
                    break;

                case 'Numpad6' || 'Digit6':
                    this._orthoCamera.position.x = -10;
                    this._orthoCamera.position.y = 0;
                    this._orthoCamera.position.z = 0;
                    this._orthoCamera.rotation.x = 0;
                    this._orthoCamera.rotation.y = Math.PI / 2;
                    break;
                case 'Numpad2' || 'Digit2':
                    // front view
                    this._orthoCamera.position.x = 0;
                    this._orthoCamera.position.y = 0;
                    this._orthoCamera.position.z = 10;
                    this._orthoCamera.rotation.x = 0;
                    this._orthoCamera.rotation.y = Math.PI;
                    break;
                case 'Numpad7' || 'Digit7':
                    scene.activeCamera = rendererCamera;
                    break;
                case 'Numpad5' || 'Digit5':
                    //top view
                    this._orthoCamera.position.x = 0;
                    this._orthoCamera.position.y = 10;
                    this._orthoCamera.position.z = 0;
                    this._orthoCamera.rotation.x = Math.PI / 2;
                    this._orthoCamera.rotation.y = 0;
                    break;
                case 'Numpad8' || 'Digit8':
                        // front view
                        this._orthoCamera.position.x = 0;
                        this._orthoCamera.position.y = 0;
                        this._orthoCamera.position.z = -10;
                        this._orthoCamera.rotation.x = 0;
                        this._orthoCamera.rotation.y = 0;
                break;
            }

        });
    }

    private activeOrthoCamera() {
        this._orthoCamera.orthoLeft = -5;
        this._orthoCamera.orthoRight = 5;
        this._orthoCamera.orthoTop = 5;
        this._orthoCamera.orthoBottom = -5;

        this._scene.activeCamera = this._orthoCamera;

        const selection = LGM3DEditor.getInstance().selectedGameObject;
        this._orthoCamera.setTarget(selection ? selection.position : BABYLON.Vector3.ZeroReadOnly);
    }
}