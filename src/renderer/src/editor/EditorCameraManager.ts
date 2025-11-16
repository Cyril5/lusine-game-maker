// EditorCameraManager.ts
import { Game } from "@renderer/engine/Game";
import LGM3DEditor from "./LGM3DEditor";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const DISABLE_CONTROL_ON_GAME_RUN = false; // Désactiver les contrôles de la caméra lorsque le jeu tourne (TODO : Désactiver si il y a une autre caméra actif en mode jeu)
enum CamMode { Fly, Orbit, Ortho }

export default class EditorCameraManager {
    private _scene: BABYLON.Scene;
    private _canvas: HTMLCanvasElement;

    private _camera: BABYLON.UniversalCamera;
    private _orthoCam: BABYLON.FreeCamera;

    private _mode: CamMode = CamMode.Fly;
    private _mouseLook = false;
    private _mousePan = false;
    private _keys: Record<string, boolean> = {};
    private _lastPtr?: { x: number, y: number };

    private _yaw = 0; private _pitch = 0;
    private _targetYaw = 0; private _targetPitch = 0;
    private _rotSmooth = 14; // smoothing rotation

    private _vel = new BABYLON.Vector3();
    private _flyMove = 10; private _flyBoost = 3;
    private _flyAccel = 30; private _flyDamp = 10;

    private _mouseSens = 0.002;
    private _panBase = 0.02; //0.002
    private _zoomStep = 1.0;
    private _orthoMin = 0.05; private _orthoMax = 50;

    private _pivot?: BABYLON.Vector3; private _radius = 5;
    private _orbitLockUntilMouseUp = false;
    private _afterOrbitKeepDir?: BABYLON.Vector3;

    private _focusTween?: {
        t: number, dur: number,
        fromPos: BABYLON.Vector3, toPos: BABYLON.Vector3,
        fromDir: BABYLON.Vector3, toDir: BABYLON.Vector3
    };

    constructor(canvas: HTMLCanvasElement, scene: BABYLON.Scene, rendererCamera: BABYLON.UniversalCamera) {
        this._scene = scene; this._canvas = canvas; this._camera = rendererCamera;
        this._camera.doNotSerialize = true; this._camera.minZ = 0.2; this._camera.maxZ = 1500; this._camera.inertia = 0;

        this._orthoCam = new BABYLON.FreeCamera("_EDITOR_ORTHO", new BABYLON.Vector3(0, 10, 10), scene);
        this._orthoCam.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA; this._orthoCam.minZ = 0.1; this._orthoCam.maxZ = 5000;
        this._orthoCam.doNotSerialize = true; this._setOrthoBounds(5);

        const f = this._camera.getDirection(BABYLON.Axis.Z).scale(-1);
        this._yaw = this._targetYaw = Math.atan2(f.x, f.z);
        this._pitch = this._targetPitch = Math.asin(clamp(f.y, -1, 1));

        // Game.getInstance().onGameStarted.add(() => {
        //     this._camera.inputs.attached.mouse.detachControl();
        //     this._camera.inputs.attached.keyboard.detachControl();
        // });

        this._canvas.addEventListener("contextmenu", e => e.preventDefault());
        this._canvas.style.touchAction = "none";

        scene.onPointerObservable.add(pi => {

            if (Game.getInstance().isRunning && DISABLE_CONTROL_ON_GAME_RUN) return;

            if (pi.type === BABYLON.PointerEventTypes.POINTERWHEEL) this._onWheel(pi.event as WheelEvent);
            if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) this._onPointerDown(pi.event as PointerEvent);
            if (pi.type === BABYLON.PointerEventTypes.POINTERUP) this._onPointerUp(pi.event as PointerEvent);
            if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) this._onPointerMove(pi.event as PointerEvent);
        });

        // rendre le canvas focusable
        if (!this._canvas.hasAttribute("tabindex")) {
            this._canvas.tabIndex = 0;
        }

        // quand on clique dans la viewport → focus clavier
        this._canvas.addEventListener("pointerdown", () => {
            this._canvas.focus();
        });

        this._canvas.addEventListener("keydown", e => this._onKey(e, true));
        this._canvas.addEventListener("keyup", e => this._onKey(e, false));
        this._scene.onBeforeRenderObservable.add(() => this._update());
    }

    // ====== Inputs ======
    private _onWheel(e: WheelEvent) {
        const d = Math.sign(e.deltaY);
        if (this._scene.activeCamera === this._orthoCam) {
            const size = this._orthoCam.orthoRight - this._orthoCam.orthoLeft;
            let half = size * 0.5 * (1 + d * 0.1);
            half = clamp(half, this._orthoMin, this._orthoMax);
            this._setOrthoBounds(half);
        } else {
            const step = this._zoomStep * (e.ctrlKey ? 5 : 1);
            if (this._mode === CamMode.Orbit && this._pivot) {
                const dir = this._pivot.subtract(this._camera.position).normalize();
                this._camera.position.addInPlace(dir.scale(step * -d));
                this._radius = BABYLON.Vector3.Distance(this._camera.position, this._pivot);
                this._camera.setTarget(this._pivot);
            } else {
                const move = this._camera.getDirection(BABYLON.Axis.Z).scale(-step * d);
                this._camera.position.addInPlace(move);
            }
        }
    }

    private _onPointerDown(ev: PointerEvent) {
        if (ev.button === 2) { // RMB
            this._mouseLook = true; this._lastPtr = { x: ev.clientX, y: ev.clientY }; this._vel.set(0, 0, 0);
            this._canvas.requestPointerLock?.();
            const wantOrbit = ev.altKey || this._orbitLockUntilMouseUp;
            if (wantOrbit) {
                const info = this._getSelectionInfo();
                if (info) {
                    this._pivot = info.center; const dist = BABYLON.Vector3.Distance(this._camera.position, info.center);
                    this._radius = Math.max(info.radius * 1.6, dist);
                    const off = this._camera.position.subtract(info.center); const r = Math.max(1e-4, off.length());
                    this._yaw = this._targetYaw = Math.atan2(off.x, off.z);
                    this._pitch = this._targetPitch = Math.asin(off.y / r);
                    this._mode = CamMode.Orbit;
                } else { this._pivot = undefined; this._mode = CamMode.Fly; }
            } else this._mode = CamMode.Fly;
        }
        if (ev.button === 1) { this._mousePan = true; this._lastPtr = { x: ev.clientX, y: ev.clientY }; }
    }

    private _onPointerUp(ev: PointerEvent) {
        if (ev.button === 2) {
            document.exitPointerLock?.();
            if (this._mode === CamMode.Orbit && this._pivot) {
                const dir = this._pivot.subtract(this._camera.position).normalize();
                this._yaw = this._targetYaw = Math.atan2(dir.x, dir.z);
                this._pitch = this._targetPitch = Math.asin(clamp(dir.y, -1, 1));
                this._afterOrbitKeepDir = dir.clone();
            }
            this._mouseLook = false; this._orbitLockUntilMouseUp = false;
            this._mode = (this._scene.activeCamera === this._orthoCam) ? CamMode.Ortho : CamMode.Fly;
        }
        if (ev.button === 1) this._mousePan = false;
    }

    private _onPointerMove(ev: PointerEvent) {
        if (!this._lastPtr) return;
        const dx = (document.pointerLockElement === this._canvas) ? ev.movementX : ev.clientX - this._lastPtr.x;
        const dy = (document.pointerLockElement === this._canvas) ? ev.movementY : ev.clientY - this._lastPtr.y;
        this._lastPtr = { x: ev.clientX, y: ev.clientY };

        if (this._scene.activeCamera === this._orthoCam) {
            if (this._mousePan) {
                const r = this._orthoCam.getDirection(BABYLON.Axis.X);
                const u = this._orthoCam.getDirection(BABYLON.Axis.Y);
                const size = this._orthoCam.orthoRight - this._orthoCam.orthoLeft;
                const k = size / this._canvas.clientHeight;
                this._orthoCam.position.addInPlace(r.scale(-dx * k));
                this._orthoCam.position.addInPlace(u.scale(dy * k));
                ev.preventDefault();
            }
            return;
        }

        if (this._mouseLook) {
            if (this._mode === CamMode.Orbit && this._pivot) {
                const sens = this._mouseSens * 0.9;
                this._targetYaw += dx * sens; this._targetPitch -= dy * sens;
                this._targetPitch = clamp(this._targetPitch, -Math.PI * 0.499, Math.PI * 0.499);
                ev.preventDefault();
            } else if (this._mode === CamMode.Fly) {
                this._targetYaw += dx * this._mouseSens; this._targetPitch -= dy * this._mouseSens;
                this._targetPitch = clamp(this._targetPitch, -Math.PI * 0.499, Math.PI * 0.499);
                ev.preventDefault();
            }
        } else if (this._mousePan) {
            const r = this._flyRight(); const u = BABYLON.Axis.Y;
            const tgt = this._camera.target ?? BABYLON.Vector3.Zero();
            const pan = this._panBase * Math.max(1, BABYLON.Vector3.Distance(this._camera.position, tgt));
            this._camera.position.addInPlace(r.scale(-dx * pan));
            this._camera.position.addInPlace(u.scale(dy * pan));
            if (this._mode === CamMode.Orbit && this._pivot) {
                this._pivot.addInPlace(r.scale(-dx * pan));
                this._pivot.addInPlace(u.scale(dy * pan));
                this._camera.setTarget(this._pivot);
            }
            ev.preventDefault();
        }
    }

    private _onKey(ev: KeyboardEvent, down: boolean) {
        this._keys[ev.code] = down;
        if (down) {
            switch (ev.code) {
                case 'KeyF': this._focusSelection(0.25); break;
                case 'KeyG': LGM3DEditor.getInstance().setTransformGizmoMode("TRANSLATE"); break;
                case 'KeyR': LGM3DEditor.getInstance().setTransformGizmoMode("ROTATE"); break;
                case 'KeyS': LGM3DEditor.getInstance().setTransformGizmoMode("SCALE"); break;
                case 'KeyM': this._scene.activeCamera = this._camera; this._mode = CamMode.Fly; break;
            }
        }
    }

    // ====== Update ======
    private _update() {

        if (Game.getInstance().isRunning && DISABLE_CONTROL_ON_GAME_RUN) return;

        const dt = this._scene.getEngine().getDeltaTime() / 1000;

        // === FOCUS TWEEN ===
        if (this._focusTween) {
            const tw = this._focusTween;
            tw.t = Math.min(tw.dur, tw.t + dt);
            const s = 1 - Math.pow(1 - (tw.t / tw.dur), 3); // easeOutCubic

            // Interpolation position + direction
            BABYLON.Vector3.LerpToRef(tw.fromPos, tw.toPos, s, this._camera.position);
            const dir = BABYLON.Vector3.Lerp(tw.fromDir, tw.toDir, s).normalize();
            this._camera.setTarget(this._camera.position.add(dir));

            // Pilote directement yaw/pitch par le tween (pas de smoothing ici)
            this._yaw = Math.atan2(dir.x, dir.z);
            this._pitch = Math.asin(clamp(dir.y, -1, 1));

            if (tw.t >= tw.dur) {
                this._focusTween = undefined;
                // ⚠️ Très important : resync les cibles du smoothing
                this._targetYaw = this._yaw;
                this._targetPitch = this._pitch;
            }
            return; // on sort, rien d’autre cette frame
        }

        // === LISSAGE ROTATION ===
        const k = 1 - Math.exp(-this._rotSmooth * dt);
        this._yaw += (this._targetYaw - this._yaw) * k;
        this._pitch += (this._targetPitch - this._pitch) * k;

        // === Sorties Ortho ===
        if (this._scene.activeCamera === this._orthoCam) {
            this._mode = CamMode.Ortho;
            return;
        }

        // === Post-Orbit : garde l’orientation finale 1 frame ===
        if (this._afterOrbitKeepDir) {
            this._camera.setTarget(this._camera.position.add(this._afterOrbitKeepDir));
            this._afterOrbitKeepDir = undefined;
        }

        // === Orbit ===
        if (this._mode === CamMode.Orbit && this._pivot) {
            const cp = Math.cos(this._pitch), sp = Math.sin(this._pitch);
            const cy = Math.cos(this._yaw), sy = Math.sin(this._yaw);
            const off = new BABYLON.Vector3(sy * cp, sp, cy * cp).scale(this._radius);
            this._camera.position.copyFrom(this._pivot.add(off));
            this._camera.setTarget(this._pivot);
            return;
        }

        // === Fly ===
        const forward = this._flyForward();
        this._camera.setTarget(this._camera.position.add(forward));

        const wish = new BABYLON.Vector3();
        if (this._keys['KeyW'] || this._keys['ArrowUp']) wish.addInPlace(forward);
        if (this._keys['KeyS'] || this._keys['ArrowDown']) wish.addInPlace(forward.scale(-1));
        if (this._keys['KeyD'] || this._keys['ArrowRight']) wish.addInPlace(this._flyRight());
        if (this._keys['KeyA'] || this._keys['ArrowLeft']) wish.addInPlace(this._flyRight().scale(-1));
        if (this._keys['Space']) wish.addInPlace(BABYLON.Axis.Y);

        if (wish.lengthSquared() > 0) wish.normalize();

        const speed = (this._keys['ShiftLeft'] || this._keys['ShiftRight'])
            ? this._flyMove * this._flyBoost
            : this._flyMove;

        const targetVel = wish.scale(speed);
        this._vel.addInPlace(targetVel.subtract(this._vel).scale(this._flyAccel * dt));
        this._vel.scaleInPlace(Math.exp(-this._flyDamp * dt));
        this._camera.position.addInPlace(this._vel.scale(dt));
    }

    // ====== Helpers ======
    private _flyForward(): BABYLON.Vector3 {
        const cy = Math.cos(this._yaw), sy = Math.sin(this._yaw);
        const cp = Math.cos(this._pitch), sp = Math.sin(this._pitch);
        return new BABYLON.Vector3(sy * cp, sp, cy * cp).normalize();
    }
    private _flyRight(): BABYLON.Vector3 {
        const up = BABYLON.Axis.Y;
        return BABYLON.Vector3.Cross(this._flyForward(), up).normalize().scale(-1);
    }
    private _setOrthoBounds(half: number) {
        this._orthoCam.orthoLeft = -half; this._orthoCam.orthoRight = half;
        this._orthoCam.orthoTop = half; this._orthoCam.orthoBottom = -half;
    }
    private _getSelectionInfo(): { center: BABYLON.Vector3, radius: number } | null {
        const sel = LGM3DEditor.getInstance()?.selectedGameObject; if (!sel) return null;
        const bi = (sel as any).getBoundingInfo?.() as BABYLON.BoundingInfo | undefined;
        if (bi) return { center: bi.boundingBox.centerWorld.clone(), radius: bi.boundingSphere.radiusWorld || 1 };
        return { center: sel.localPosition.clone(), radius: 1 };
    }
    private _focusSelection(durationSec = 0.25) {
        const info = this._getSelectionInfo(); if (!info) return;
        const center = info.center, radius = Math.max(0.001, info.radius);

        const fov = this._camera.fov;
        const dist = Math.max(0.5, radius / Math.tan(fov * 0.5)) + radius * 0.25;

        const fromPos = this._camera.position.clone();
        const fromDir = this._camera.getDirection(BABYLON.Axis.Z).scale(-1).normalize();

        // Position finale visée
        const toPos = center.subtract(center.subtract(this._camera.position).normalize().scale(dist));
        // Direction finale visée (depuis la position finale vers le centre)
        const toDir = center.subtract(toPos).normalize();

        this._focusTween = { t: 0, dur: durationSec, fromPos, toPos, fromDir, toDir };

        // 👉 Définir d'avance la cible de smoothing sur la direction finale
        const endYaw = Math.atan2(toDir.x, toDir.z);
        const endPitch = Math.asin(clamp(toDir.y, -1, 1));
        this._targetYaw = endYaw;
        this._targetPitch = endPitch;

        // Armer l’orbite pour RMB juste après le focus
        this._pivot = center.clone();
        this._radius = dist;
        this._orbitLockUntilMouseUp = true;

        // Stopper tout drift de mouvement pendant le focus
        this._vel.set(0, 0, 0);

        // S'assurer d'être sur la cam 3D
        if (this._scene.activeCamera !== this._camera) {
            this._scene.activeCamera = this._camera;
            this._mode = CamMode.Fly;
        }
    }

    createEditorUtilityLayer(scene: BABYLON.Scene) {
        const utilityLayer = new BABYLON.UtilityLayerRenderer(scene);
        utilityLayer.pickUtilitySceneFirst = false; // on veut d’abord picker la scène principale

        const gizmoScene = utilityLayer.utilityLayerScene;

        // Caméra de la utility scene : on la “suit” parente de la mainCamera
        const mainCamera = scene.activeCamera!;
        const gizmoCamera = new BABYLON.ArcRotateCamera(
            "__EDITOR_GIZMO_CAM__",
            mainCamera.alpha ?? 0,
            mainCamera.beta ?? 0,
            mainCamera.radius ?? 10,
            mainCamera.target,
            gizmoScene
        );

        gizmoCamera.doNotSerialize = true;
        gizmoCamera.parent = mainCamera;       // même mouvement que la caméra principale
        gizmoScene.activeCamera = gizmoCamera;

        return { utilityLayer, gizmoScene, gizmoCamera };
    }
}


