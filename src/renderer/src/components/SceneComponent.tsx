import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core";
import EditorUtils from "@renderer/editor/EditorUtils";

function attachAutoResize(canvas: HTMLCanvasElement, engine: Engine) {
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
  const apply = () => {
    raf = 0;
    const dpr = window.devicePixelRatio || 1;
    engine.setHardwareScalingLevel(1 / dpr); // rendu net hi-DPI
    engine.resize();                          // ajuste le framebuffer
  };

  // Resize du conteneur (panel dockable / split)
  const ro = new ResizeObserver(schedule);
  ro.observe(canvas.parentElement!);

  // Changement de DPR (zoom OS/écran)
  window.addEventListener("resize", schedule);

  // init immédiate
  schedule();

  return () => {
    ro.disconnect();
    window.removeEventListener("resize", schedule);
    if (raf) cancelAnimationFrame(raf);
  };
}

export default ({ antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady, ...rest }) => {
  const reactCanvas = useRef(null);
  const engineRef = useRef<BABYLON.Engine | BABYLON.WebGPUEngine>(null);

  let scene: Scene;

  let rendererEngineType: number = 0;


  const initEngine = async (canvas) => {
    switch (rendererEngineType) {
      case 1:
        const webGPUSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;
        if (webGPUSupported) {
          engineRef.current = new BABYLON.WebGPUEngine(canvas);

          await engineRef.current.initAsync();
          console.log("WebGPU engine ready");
          break;
        }

      default:
        //engineRef.current = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);
        engineRef.current = new Engine(canvas, true, engineOptions, true);
        break;
    }

    scene = new Scene(engineRef.current, sceneOptions);
    if (scene.isReady()) {
      onSceneReady(scene);
    } else {
      scene.onReadyObservable.addOnce((scene) => onSceneReady(scene));
    }



    engineRef.current.runRenderLoop(() => {
      if (typeof onRender === "function") onRender(scene);
      scene.render();
    });
  }

  useEffect(() => {
    rendererEngineType = EditorUtils.showMsgDialog({
      message: 'Choisissez le moteur de rendu',
      type: 'info',
      buttons: ['WEBGL 2.0 (Stable)', 'WEB GPU'],
      defaultId: 0,
      title: "",
    });

  }, [])

  useEffect(() => {
    const { current: canvas } = reactCanvas;
    if (!canvas) return;

    // (1) init engine + scene comme tu fais déjà
    initEngine(canvas); // crée engineRef.current & la scene

    //(2) auto-resize propre (panel + DPR)
    let detach = () => { };
    const waitEngine = () => {
      if (!engineRef.current) return requestAnimationFrame(waitEngine);
      detach = attachAutoResize(canvas, engineRef.current);
    };
    waitEngine();

    return () => {
      detach();
      scene.getEngine().dispose();
    };
  }, [antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady]);

  return <canvas id="canvasRender" ref={reactCanvas} {...rest} />;
};