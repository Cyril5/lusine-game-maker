import * as BABYLON from "@babylonjs/core";

export enum OrthoViewDirection {
    Left,
    Right,
    Front,
    Back,
    Top,
    Bottom
}

export class OrthoViewController {
    public readonly cam: BABYLON.FreeCamera;
    private _scene: BABYLON.Scene;
    private _canvas: HTMLCanvasElement;

    private _half = 5;
    private _min = 0.05;
    private _max = 200;

    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
        this._scene = scene;
        this._canvas = canvas;

        this.cam = new BABYLON.FreeCamera("_ORTHO", new BABYLON.Vector3(0, 5, 5), scene);
        this.cam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.cam.minZ = 0.01;
        this.cam.maxZ = 5000;
        this.cam.doNotSerialize = true;

        this._applyBounds();
    }

    private _applyBounds() {
        this.cam.orthoLeft = -this._half;
        this.cam.orthoRight = this._half;
        this.cam.orthoTop = this._half;
        this.cam.orthoBottom = -this._half;
    }

    /** Zoom */
    public zoom(delta: number) {
        this._half *= (1 + delta * 0.1);
        this._half = BABYLON.Scalar.Clamp(this._half, this._min, this._max);
        this._applyBounds();
    }

    /** Panning */
    public pan(dx: number, dy: number) {
        const r = this.cam.getDirection(BABYLON.Axis.X);
        const u = this.cam.getDirection(BABYLON.Axis.Y);
        const k = (this.cam.orthoRight - this.cam.orthoLeft) / this._canvas.clientHeight;

        this.cam.position.addInPlace(r.scale(-dx * k));
        this.cam.position.addInPlace(u.scale(dy * k));
    }

    /** Change direction de vue */
    public setView(dir: OrthoViewDirection, center: BABYLON.Vector3, dist: number) {
        switch (dir) {
            case OrthoViewDirection.Left:
                this.cam.position.copyFrom(center.add(new BABYLON.Vector3(-dist, 0, 0)));
                this.cam.setTarget(center);
                this.cam.upVector.set(0, 1, 0);
                break;

            case OrthoViewDirection.Right:
                this.cam.position.copyFrom(center.add(new BABYLON.Vector3(dist, 0, 0)));
                this.cam.setTarget(center);
                this.cam.upVector.set(0, 1, 0);
                break;

            case OrthoViewDirection.Front:
                this.cam.position.copyFrom(center.add(new BABYLON.Vector3(0, 0, -dist)));
                this.cam.setTarget(center);
                this.cam.upVector.set(0, 1, 0);
                break;

            case OrthoViewDirection.Back:
                this.cam.position.copyFrom(center.add(new BABYLON.Vector3(0, 0, dist)));
                this.cam.setTarget(center);
                this.cam.upVector.set(0, 1, 0);
                break;

            case OrthoViewDirection.Top:
                this.cam.position.copyFrom(center.add(new BABYLON.Vector3(0, dist, 0)));
                this.cam.setTarget(center);
                this.cam.upVector.set(0, 0, -1); // comme Blender
                break;

            case OrthoViewDirection.Bottom:
                this.cam.position.copyFrom(center.add(new BABYLON.Vector3(0, -dist, 0)));
                this.cam.setTarget(center);
                this.cam.upVector.set(0, 0, 1);
                break;
        }
    }

    /** Ajuste le zoom ortho selon les bounds */
    public fitToBounds(size: BABYLON.Vector3) {
        const maxAxis = Math.max(size.x, size.y, size.z);
        this._half = maxAxis * 0.6;
        this._applyBounds();
    }
}
