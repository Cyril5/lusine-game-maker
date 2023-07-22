import { useEffect, useRef } from "react";
import { Engine, Scene, Vector3 } from "@babylonjs/core";


export default ({ antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady, ...rest }) => {
  const reactCanvas = useRef(null);

  const initWebGPUEngine = async (canvas)=> {
    const engine = new BABYLON.WebGPUEngine(canvas);
     await engine.initAsync();
  }

  // set up basic engine and scene
  useEffect(() => {
    const { current: canvas } = reactCanvas;


    if (!canvas) return;

    //initWebGPUEngine(canvas);
    const engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);

    const scene = new Scene(engine, sceneOptions);
    if (scene.isReady()) {
      onSceneReady(scene);
    } else {
      scene.onReadyObservable.addOnce((scene) => onSceneReady(scene));
    }



    engine.runRenderLoop(() => {
      if (typeof onRender === "function") onRender(scene);
      scene.render();
    });

    const resize = () => {
      scene.getEngine().resize();
    };

    if (window) {
      window.addEventListener("resize", resize);
    }

    return () => {
      scene.getEngine().dispose();

      if (window) {
        window.removeEventListener("resize", resize);
      }
    };
  }, [antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady]);

  return <canvas id="canvasRender" ref={reactCanvas} {...rest} />;
};