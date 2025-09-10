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

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;

        // Nettoyage automatique
        this.scene.onDisposeObservable.add(() => this.dispose());
    }

    /** Crée (ou remplace) le pipeline et l’attache à la caméra */
    init(camera: BABYLON.Camera, opts?: PostFXOptions) {
        this._attachedCamera = camera;
        this._retargetPipelineTo(camera);
        // Détruire l’ancien pipeline si besoin
        this.pipeline?.dispose();

        // Important: activer le buffer HDR sur le render target pour un meilleur tone mapping/bloom
        this.scene.getEngine().setHardwareScalingLevel(this.scene.getEngine().getHardwareScalingLevel());
        this.scene.imageProcessingConfiguration.toneMappingEnabled = false; // on laisse le pipeline gérer

        const name = "LGM_DefaultPipeline";
        const isHDR = true; //default :true

        this.pipeline = new BABYLON.DefaultRenderingPipeline(
            name,
            isHDR,
            this.scene,
            [camera]  // attaché à ta caméra d’éditeur / jeu
        );

        const p = this.pipeline;
        // Anti-aliasing
        p.fxaaEnabled = true; // léger et propre

        // Tonemapping “ciné” mais subtil
        p.imageProcessingEnabled = true;
        p.imageProcessing.toneMappingEnabled = true;
        p.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        p.imageProcessing.exposure = 1.05;  // +5% de peps
        p.imageProcessing.contrast = 1.08;  // un peu de mordant

        // Légère accentuation des couleurs (optionnel)
        const cc = new BABYLON.ColorCurves();
        cc.globalSaturation = 15;  // [-100..100]
        cc.globalContrast = 8;
        p.imageProcessing.colorCurvesEnabled = true;
        p.imageProcessing.colorCurves = cc;

        // Bloom très discret pour le “sheen” (phares, néons…)
        p.bloomEnabled = true;
        p.bloomThreshold = 0.93; // n’allume que les hautes lumières
        p.bloomWeight = 0.18;  // très léger
        p.bloomKernel = 64;
        p.bloomScale = 0.5;   // perf

        // DOF très faible (ciné). À couper en édition si tu veux.
        p.depthOfFieldEnabled = true;
        p.depthOfField.focalLength = 80;  // + petit = plus net
        p.depthOfField.fStop = 12;        // + grand = plus de netteté (évite blur excessif)
        p.depthOfField.focusDistance = 2000; // distance en mm (ajuste selon ta scène)
        p.depthOfField.blurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low; // toon-friendly

        // AA léger dans l’éditeur
        //this.pipeline.fxaaEnabled = !!opts?.fxaa;

        // // Tone mapping ACES pour un rendu plus “ciné”
        // this.pipeline.imageProcessingEnabled = true;
        // this.pipeline.imageProcessing.toneMappingEnabled = !!opts?.toneMapping;
        // this.pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        // this.pipeline.imageProcessing.exposure = opts?.exposure ?? 1.0;
        // this.pipeline.imageProcessing.contrast = opts?.contrast ?? 1.0;

        // // Bloom
        // this.pipeline.bloomEnabled = !!opts?.bloom;
        // if (this.pipeline.bloomEnabled) {
        //     this.pipeline.bloomThreshold = opts?.bloomThreshold ?? 0.9;
        //     this.pipeline.bloomWeight = opts?.bloomWeight ?? 0.35;
        //     this.pipeline.bloomKernel = opts?.bloomKernel ?? 64;
        //     this.pipeline.bloomScale = 0.5; // moitié de résolution pour perf
        // }

        // // DOF simple (attention au coût sur scènes lourdes)
        // this.pipeline.depthOfFieldEnabled = !!opts?.dof;
        // if (this.pipeline.depthOfFieldEnabled) {
        //     // Réglages “safe” pour l’éditeur (faible blur, distance moyenne)
        //     this.pipeline.depthOfField.focalLength = 150; // en mm virtuels
        //     this.pipeline.depthOfField.fStop = 3.5;
        //     this.pipeline.depthOfField.focusDistance = 2000; // en mm virtuels
        //     this.pipeline.depthOfField.blurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
        // }

        // S’assurer que le pipeline suit la caméra si tu en changes
        this.scene.onActiveCameraChanged.add(() => {
            if (!this.pipeline) return;
            const cam = this.scene.activeCamera ?? this._attachedCamera;
            if (cam) this._retargetPipelineTo(cam);
        });
    }

    /** Preset “Cinematic”: ACES, bloom doux, contraste subtil */
    applyPreset(preset: PostFXPreset) {
        if (!this.pipeline) return;

        switch (preset) {
            case "cinematic": {
                this.pipeline.fxaaEnabled = true;
                this.pipeline.imageProcessingEnabled = true;
                this.pipeline.imageProcessing.toneMappingEnabled = true;
                this.pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
                this.pipeline.imageProcessing.exposure = 1.1;
                this.pipeline.imageProcessing.contrast = 1.05;

                this.pipeline.bloomEnabled = true;
                this.pipeline.bloomThreshold = 0.88;
                this.pipeline.bloomWeight = 0.4;
                this.pipeline.bloomKernel = 96;
                this.pipeline.bloomScale = 0.5;

                this.pipeline.depthOfFieldEnabled = false; // en édition souvent OFF
                break;
            }

            case "crisp": {
                // Rendu “studio” net pour travailler les matériaux
                this.pipeline.fxaaEnabled = true;
                this.pipeline.imageProcessingEnabled = true;
                this.pipeline.imageProcessing.toneMappingEnabled = true;
                this.pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
                this.pipeline.imageProcessing.exposure = 1.0;
                this.pipeline.imageProcessing.contrast = 1.08;

                this.pipeline.bloomEnabled = false;
                this.pipeline.depthOfFieldEnabled = false;
                break;
            }

            case "game": {
                // Compromis perf/qualité pour prévisualiser “in-game”
                this.pipeline.fxaaEnabled = true;
                this.pipeline.imageProcessingEnabled = true;
                this.pipeline.imageProcessing.toneMappingEnabled = true;
                this.pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
                this.pipeline.imageProcessing.exposure = 1.05;
                this.pipeline.imageProcessing.contrast = 1.03;

                this.pipeline.bloomEnabled = true;
                this.pipeline.bloomThreshold = 0.92;
                this.pipeline.bloomWeight = 0.28;
                this.pipeline.bloomKernel = 64;
                this.pipeline.bloomScale = 0.5;

                this.pipeline.depthOfFieldEnabled = false;
                break;
            }
            case "toon3d": {
                this.pipeline.fxaaEnabled = true;

                this.pipeline.imageProcessingEnabled = true;
                this.pipeline.imageProcessing.toneMappingEnabled = true;
                this.pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

                this.pipeline.imageProcessing.exposure = 1.1;  // couleurs plus lumineuses
                this.pipeline.imageProcessing.contrast = 1.15; // boost cartoon

                this.pipeline.bloomEnabled = false;
                this.pipeline.depthOfFieldEnabled = false;
                break;
            }
        }
    }

    private _retargetPipelineTo(camera?: BABYLON.Camera) {
        if (!this.pipeline) return;

        // retirer toutes les caméras courantes
        // (copie pour éviter de muter pendant l'itération)
        const current = [...this.pipeline.cameras];
        for (const c of current) this.pipeline.removeCamera(c);

        // ajouter la nouvelle
        if (camera) this.pipeline.addCamera(camera);
    }

    setExposure(value: number) {
        if (!this.pipeline) return;
        this.pipeline.imageProcessing.exposure = value;
    }

    setContrast(value: number) {
        if (!this.pipeline) return;
        this.pipeline.imageProcessing.contrast = value;
    }

    setBloom(enabled: boolean) {
        if (!this.pipeline) return;
        this.pipeline.bloomEnabled = enabled;
    }

    setFXAA(enabled: boolean) {
        if (!this.pipeline) return;
        this.pipeline.fxaaEnabled = enabled;
    }

    dispose() {
        this.pipeline?.dispose();
        this.pipeline = undefined;
    }
}
