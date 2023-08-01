import { useEffect, useRef } from "react";
import { Engine, Scene, Vector3 } from "@babylonjs/core";
import EditorUtils from "@renderer/editor/EditorUtils";


export default ({ antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady, ...rest }) => {
  const reactCanvas = useRef(null);

  let rendererEngineType : number = 0;

  const initWebGPUEngine = async (canvas)=> {
    let engine: BABYLON.WebGPUEngine | Engine;
    switch (rendererEngineType) {
      case 1:
        engine = new BABYLON.WebGPUEngine(canvas);
        await engine.initAsync();
        break;
    
      default:
        engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);
        break;
    }

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
  }

  useEffect(()=>{
    rendererEngineType = EditorUtils.showMsgDialog({
      message: 'Choisissez le moteur de rendu',
      type: 'info',
      buttons: ['WEBGL 2.0', 'WEB GPU'],
      defaultId: 0,
      title: "",
    });

  },[])

  // set up basic engine and scene
  useEffect(() => {
    const { current: canvas } = reactCanvas;


    if (!canvas) return;

    initWebGPUEngine(canvas);
    //const engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);

    // const scene = new Scene(engine, sceneOptions);
    // if (scene.isReady()) {
    //   onSceneReady(scene);
    // } else {
    //   scene.onReadyObservable.addOnce((scene) => onSceneReady(scene));
    // }



    // engine.runRenderLoop(() => {
    //   if (typeof onRender === "function") onRender(scene);
    //   scene.render();
    // });

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