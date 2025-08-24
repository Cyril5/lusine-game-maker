import { Game } from "@renderer/engine/Game";
import LGM3DEditor from "./LGM3DEditor";

type NumLike = number;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default class EditorCameraManager {

    // TODO : Bloquer les inputs/désactiver la caméra en jeu mais la libérer si on appuie sur F10

    private _scene: BABYLON.Scene;
    private _canvas: HTMLCanvasElement;

    private _camera!: BABYLON.Camera;
    private _orthoCamera: BABYLON.FreeCamera;

    // fly params
    private _flyActive = false;
    private _keys: Record<string, boolean> = {};
    private _vel = new BABYLON.Vector3();
    private _yaw = 0;
    private _pitch = 0;
    private _mouseLook = false;
    private _mousePan = false;
    private _lastPointer?: { x: number; y: number };

    // config
    private _flyMoveSpeed = 20;          // m/s
    private _flyBoostMult = 3;
    private _flyAccel = 30;             // m/s²
    private _flyDamp = 10;              // 1/s
    private _mouseSensitivity = 0.0023; // rad/pixel
    private _panSpeed = 0.01;           // world units per pixel
    private _zoomStep = 1.0;            // units per wheel step in fly
    private _zoomOrthoMin = 0.05;
    private _zoomOrthoMax = 50;

    // focus tween
    private _focusTween?: {
        t: number, dur: number,
        fromPos: BABYLON.Vector3, toPos: BABYLON.Vector3,
        fromDir: BABYLON.Vector3, toDir: BABYLON.Vector3
    };

    constructor(canvas: HTMLCanvasElement, scene: BABYLON.Scene, rendererCamera: BABYLON.Camera) {
        this._scene = scene;
        this._canvas = canvas;
        this._camera = rendererCamera;
        // --- ORTHO CAMERA ---
        this._orthoCamera = new BABYLON.FreeCamera('_EDITOR_ORTHO_CAM', new BABYLON.Vector3(0, 0, -10), scene);
        this._orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this._orthoCamera.minZ = 0.1;
        this._orthoCamera.maxZ = 10000;
        this._orthoCamera.doNotSerialize = true;
        this._setOrthoBounds(5); // demi-taille de frustum au départ

        // init yaw/pitch d’après le forward courant
        const f = this._camera.getDirection(BABYLON.Axis.Z).scale(-1);
        this._yaw = Math.atan2(f.x, f.z);
        this._pitch = Math.asin(clamp(f.y, -1, 1));

        Game.getInstance().onGameStarted.add(()=>{
            this._camera.inputs.attached.mouse.detachControl();
            this._camera.inputs.attached.keyboard.detachControl();
        });

        // --- INPUTS / EVENTS ---
        // Molette
        scene.onPointerObservable.add((pi) => {

            if (Game.getInstance().isRunning) return;

            if (pi.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                const e = pi.event as WheelEvent;
                const delta = Math.sign(e.deltaY);
                if (this._scene.activeCamera === this._orthoCamera) {
                    // zoom en ORTHO: scale des bornes
                    const size = this._orthoCamera.orthoRight - this._orthoCamera.orthoLeft;
                    const half = size * 0.5;
                    let newHalf = half * (1 + delta * 0.1);
                    newHalf = clamp(newHalf, this._zoomOrthoMin, this._zoomOrthoMax);
                    this._setOrthoBounds(newHalf);
                } else {
                    // zoom en FLY: avance/recul
                    const step = this._zoomStep * (e.ctrlKey ? 5 : 1);
                    const move = this._camera.getDirection(BABYLON.Axis.Z).scale(-step * delta);
                    this._camera.position.addInPlace(move);
                }
            }

            if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                const ev = pi.event as PointerEvent;
                // 2 = right, 1 = middle, 0 = left
                if (ev.button === 0) {
                    this._mouseLook = true;
                    this._lastPointer = { x: ev.clientX, y: ev.clientY };
                    // Optionnel: empêcher la sélection de texte pendant le drag
                    ev.preventDefault();
                } else if (ev.button === 2) {
                    this._mousePan = true;
                    this._lastPointer = { x: ev.clientX, y: ev.clientY };
                    ev.preventDefault();
                }
            } else if (pi.type === BABYLON.PointerEventTypes.POINTERUP) {
                const ev = pi.event as PointerEvent;
                if (ev.button === 0) this._mouseLook = false;
                if (ev.button === 2) this._mousePan = false;
            } else if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                if (!this._lastPointer) return;
                const ev = pi.event as PointerEvent;
                const dx = ev.clientX - this._lastPointer.x;
                const dy = ev.clientY - this._lastPointer.y;
                this._lastPointer = { x: ev.clientX, y: ev.clientY };

                if (this._scene.activeCamera === this._camera) {
                    if (this._mouseLook) {
                        this._yaw += dx * this._mouseSensitivity;
                        this._pitch -= dy * this._mouseSensitivity;
                        this._pitch = clamp(this._pitch, -Math.PI * 0.499, Math.PI * 0.499);
                        ev.preventDefault();
                    } else if (this._mousePan) {
                        const right = this._flyRight();
                        const up = BABYLON.Axis.Y;
                        this._camera.position.addInPlace(right.scale(-dx * this._panSpeed));
                        this._camera.position.addInPlace(up.scale(dy * this._panSpeed));
                        ev.preventDefault();
                    }
                } else if (this._scene.activeCamera === this._orthoCamera) {
                    if (this._mousePan) {
                        const right = this._orthoCamera.getDirection(BABYLON.Axis.X);
                        const up = this._orthoCamera.getDirection(BABYLON.Axis.Y);
                        const size = this._orthoCamera.orthoRight - this._orthoCamera.orthoLeft;
                        const k = (size / this._canvas.clientHeight);
                        this._orthoCamera.position.addInPlace(right.scale(-dx * k));
                        this._orthoCamera.position.addInPlace(up.scale(dy * k));
                        ev.preventDefault();
                    }
                }
            }
        });

        // Clavier
        window.addEventListener('keydown', (ev) => this._onKey(ev, true, rendererCamera));
        window.addEventListener('keyup', (ev) => this._onKey(ev, false, rendererCamera));

        // Main update
        this._scene.onBeforeRenderObservable.add(() => this._update());
    }

    // ===== PUBLIC UTILS =====
    private activeOrthoCamera() {
        this._scene.activeCamera = this._orthoCamera;
        // reset ortho bounds à une valeur raisonnable si besoin
        if ((this._orthoCamera.orthoRight - this._orthoCamera.orthoLeft) <= 0.0001) {
            this._setOrthoBounds(5);
        }
        const selection = LGM3DEditor.getInstance().selectedGameObject;
        this._orthoCamera.setTarget(selection ? selection.position : BABYLON.Vector3.ZeroReadOnly);
        this._flyActive = false;
    }

    private activeFlyCamera() {
        this._scene.activeCamera = this._camera;
        this._flyActive = true;
    }

    // ===== PRIVATE =====
    private _setOrthoBounds(half: number) {
        this._orthoCamera.orthoLeft = -half;
        this._orthoCamera.orthoRight = half;
        this._orthoCamera.orthoTop = half;
        this._orthoCamera.orthoBottom = -half;
    }

    private _onKey(ev: KeyboardEvent, down: boolean, rendererCamera: BABYLON.Camera) {

        if(Game.getInstance().isRunning) return;

        // ZQSD + flèches, etc.
        this._keys[ev.code] = down;

        // Raccourcis de caméra
        const code = ev.code;

        // Activer ORTHO sur les touches vues (2/4/5/6/8)
        if (['Numpad2', 'Digit2', 'Numpad4', 'Digit4', 'Numpad5', 'Digit5', 'Numpad6', 'Digit6', 'Numpad8', 'Digit8'].includes(code)) {
            this.activeOrthoCamera();
        }

        if (down) {
            switch (code) {
                // Vues ORTHO (corrigé: pas de 'A || B' dans case)
                case 'Numpad4':
                case 'Digit4':
                    this._orthoCamera.position.set(10, 0, 0);
                    this._orthoCamera.rotation.set(0, -Math.PI / 2, 0);
                    break;
                case 'Numpad6':
                case 'Digit6':
                    this._orthoCamera.position.set(-10, 0, 0);
                    this._orthoCamera.rotation.set(0, Math.PI / 2, 0);
                    break;
                case 'Numpad2':
                case 'Digit2': // front
                    this._orthoCamera.position.set(0, 0, 10);
                    this._orthoCamera.rotation.set(0, Math.PI, 0);
                    break;
                case 'Numpad5':
                case 'Digit5': // top
                    this._orthoCamera.position.set(0, 10, 0);
                    this._orthoCamera.rotation.set(Math.PI / 2, 0, 0);
                    break;
                case 'Numpad8':
                case 'Digit8': // back
                    this._orthoCamera.position.set(0, 0, -10);
                    this._orthoCamera.rotation.set(0, 0, 0);
                    break;

                // Retour camera de rendu (si besoin)
                case 'Numpad7':
                case 'Digit7':
                    this._scene.activeCamera = rendererCamera;
                    this._flyActive = false;
                    break;

                // Activer FLY
                case 'KeyF': {
                    // Focus sur sélection, en fly si possible
                    if (this._scene.activeCamera !== this._camera) {
                        this.activeFlyCamera();
                    }
                    this._focusSelection(0.25);
                    break;
                }
            }
        }
    }

    private _update() {

        if (Game.getInstance().isRunning) return;

        const dt = this._scene.getEngine().getDeltaTime() / 1000;

        // Focus tween
        if (this._focusTween) {
            const tw = this._focusTween;
            tw.t = Math.min(tw.dur, tw.t + dt);
            const k = tw.t / tw.dur;
            const s = this._easeOutCubic(k);

            // pos
            BABYLON.Vector3.LerpToRef(tw.fromPos, tw.toPos, s, this._camera.position);
            // dir
            const dir = BABYLON.Vector3.Lerp(tw.fromDir, tw.toDir, s).normalize();
            const target = this._camera.position.add(dir);
            this._camera.setTarget(target);

            // maj yaw/pitch pour reprendre le contrôle fluide ensuite
            this._yaw = Math.atan2(dir.x, dir.z);
            this._pitch = Math.asin(clamp(dir.y, -1, 1));

            if (tw.t >= tw.dur) {
                this._focusTween = undefined;
            }
            return; // on freeze l'input pendant le tween
        }

        if (this._scene.activeCamera === this._camera) {
            // Appliquer yaw/pitch -> orientation
            const forward = this._flyForward();
            const target = this._camera.position.add(forward);
            this._camera.setTarget(target);

            // Inputs mouvement (ZQSD + Space/Ctrl)
            const wish = new BABYLON.Vector3();
            const wForward = (this._keys['KeyW'] || this._keys['ArrowUp']) ? 1 : (this._keys['KeyS'] || this._keys['ArrowDown']) ? -1 : 0;
            const wRight = (this._keys['KeyD'] || this._keys['ArrowRight']) ? 1 : (this._keys['KeyA'] || this._keys['ArrowLeft']) ? -1 : 0;
            const wUp = (this._keys['Space']) ? 1 : (this._keys['ControlLeft'] || this._keys['ControlRight']) ? -1 : 0;

            // base axes
            const right = this._flyRight();
            const up = BABYLON.Axis.Y;
            wish.addInPlace(forward.scale(wForward));
            wish.addInPlace(right.scale(wRight));
            wish.addInPlace(up.scale(wUp));
            if (wish.lengthSquared() > 0) wish.normalize();

            // vitesse cible
            const speed = (this._keys['ShiftLeft'] || this._keys['ShiftRight'])
                ? this._flyMoveSpeed * this._flyBoostMult
                : this._flyMoveSpeed;
            const targetVel = wish.scale(speed);

            // intégration accélération + damping critique
            const accel = targetVel.subtract(this._vel).scale(this._flyAccel * dt);
            this._vel.addInPlace(accel);
            // damping
            const dampFactor = Math.exp(-this._flyDamp * dt);
            this._vel.scaleInPlace(dampFactor);

            // appliquer déplacement
            this._camera.position.addInPlace(this._vel.scale(dt));
        }
    }

    private _flyForward(): BABYLON.Vector3 {
        const cy = Math.cos(this._yaw), sy = Math.sin(this._yaw);
        const cp = Math.cos(this._pitch), sp = Math.sin(this._pitch);
        // forward en Y-up
        return new BABYLON.Vector3(sy * cp, sp, cy * cp).normalize();
    }
    private _flyRight(): BABYLON.Vector3 {
        const up = BABYLON.Axis.Y;
        return BABYLON.Vector3.Cross(this._flyForward(), up).normalize().scale(-1);
    }

    private _easeOutCubic(x: number) { return 1 - Math.pow(1 - x, 3); }

    private _focusSelection(durationSec: number = 0.25) {
        const selection = LGM3DEditor.getInstance().selectedGameObject;
        if (!selection) return;

        // centre + rayon approximatif
        const bi = (selection as any).getBoundingInfo?.() as BABYLON.BoundingInfo | undefined;
        let center = selection.position.clone();
        let radius = 1;
        if (bi) {
            const bb = bi.boundingBox;
            center = bb.centerWorld.clone();
            radius = bb.extendSizeWorld.length(); // diagonale/2 ~ safe
        }

        // distance idéale selon FOV
        const fov = this._camera.fov;
        const dist = Math.max(0.5, radius / Math.tan(fov * 0.5)) + radius * 0.25;

        // position cible : reculer le long de la direction current forward
        const fromPos = this._camera.position.clone();
        const fromDir = this._camera.getDirection(BABYLON.Axis.Z).scale(-1).normalize();

        const toDir = center.subtract(this._camera.position).normalize();
        const toPos = center.subtract(toDir.scale(dist));

        this._focusTween = {
            t: 0, dur: durationSec,
            fromPos, toPos,
            fromDir, toDir
        };
    }
}
