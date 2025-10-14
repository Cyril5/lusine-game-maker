// src/graphics/lgm3D.PostFX.ts
import * as BABYLON from "babylonjs";

export type PostFXPreset = "cinematic" | "crisp" | "game" | "toon3d";

export interface PostFXOptions {
    /** activer FXAA (léger et utile dans l’éditeur) */
    fxaa?: boolean;
    /** activer bloom (coût moyen) */
    bloom?: boolean;
    /** profondeur de champ simple via DefaultRenderingPipeline (coût moyen/élevé) */
    dof?: boolean;
    /** exposition globale (HDR) */
    exposure?: number; // ex: 1.0 par défaut
    /** contraste global */
    contrast?: number; // ex: 1.0 par défaut
    /** tone mapping ACES */
    toneMapping?: boolean;
    /** échelle de kernel pour le bloom (flou) */
    bloomKernel?: number; // ex: 16..256
    /** seuil de bloom (plus bas = plus de zones qui brillent) */
    bloomThreshold?: number; // 0..1
    /** intensité du bloom */
    bloomWeight?: number; // 0..2
}

export class PostFXManager {
  private scene: BABYLON.Scene;
  private pipeline?: BABYLON.DefaultRenderingPipeline;
  private _attachedCamera?: BABYLON.Camera;
  private _camChangedObserver?: BABYLON.Observer<BABYLON.Scene>;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.scene.onDisposeObservable.add(() => this.dispose());
  }

  init(camera: BABYLON.Camera, opts?: PostFXOptions) {
    this._attachedCamera = camera;

    // Créer le pipeline UNE SEULE FOIS
    if (!this.pipeline) {
      this.scene.imageProcessingConfiguration.toneMappingEnabled = false;

      this.pipeline = new BABYLON.DefaultRenderingPipeline(
        "LGM_DefaultPipeline",
        /* isHDR */ true,
        this.scene,
        [camera] // première attache
      );

      const p = this.pipeline;

      // Réglages par défaut "safe" pour l'éditeur (pas de DOF ici)
      p.fxaaEnabled = true;
      p.imageProcessingEnabled = true;
      p.imageProcessing.toneMappingEnabled = true;
      p.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
      p.imageProcessing.exposure = 1.05;
      p.imageProcessing.contrast = 1.08;

      const cc = new BABYLON.ColorCurves();
      cc.globalSaturation = 15;
      cc.globalContrast = 8;
      p.imageProcessing.colorCurvesEnabled = true;
      p.imageProcessing.colorCurves = cc;

      p.bloomEnabled = true;
      p.bloomThreshold = 0.93;
      p.bloomWeight = 0.18;
      p.bloomKernel = 64;
      p.bloomScale = 0.5;

      // DOF désactivé par défaut (évite le spike au switch)
      p.depthOfFieldEnabled = false;

      // Un seul observer
      this._camChangedObserver = this.scene.onActiveCameraChanged.add(() => {
        const cam = this.scene.activeCamera ?? this._attachedCamera;
        this._retargetPipelineTo(cam || undefined);
      });
    } else {
      // Pipeline existe déjà → juste réattacher
      this._retargetPipelineTo(camera);
    }
  }

  // Optionnel: activer le DOF uniquement en "Play" ou via preset
  enableDOF(focalLength = 80, fStop = 12, focusDistance = 2000) {
    if (!this.pipeline) return;
    const p = this.pipeline;
    p.depthOfFieldEnabled = true;
    p.depthOfField.focalLength = focalLength;
    p.depthOfField.fStop = fStop;
    p.depthOfField.focusDistance = focusDistance;
    p.depthOfField.blurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
  }

  private _retargetPipelineTo(camera?: BABYLON.Camera) {
    if (!this.pipeline) return;
    const current = [...this.pipeline.cameras];
    for (const c of current) this.pipeline.removeCamera(c);
    if (camera) this.pipeline.addCamera(camera);
  }

  dispose() {
    if (this._camChangedObserver) {
      this.scene.onActiveCameraChanged.remove(this._camChangedObserver);
      this._camChangedObserver = undefined;
    }
    this.pipeline?.dispose();
    this.pipeline = undefined;
  }
}

