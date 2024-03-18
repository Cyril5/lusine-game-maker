import React, { Component, useRef } from "react";
import { Scene, Mesh } from "@babylonjs/core";
import SceneComponent from "./SceneComponent"; // uses above component in same directory
import { Renderer } from "../engine/Renderer";
import '@babylonjs/inspector';
import '@babylonjs/loaders/OBJ/objFileLoader';
import lgmLogo from '../assets/logo-block.png';
import havokLogo from '../assets/Havok_logo_yellow.png';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

export default class RendererComponent extends Component {

  box: Mesh;
  private _engine;

  fpsRef = React.createRef();

  onSceneReady = (scene: Scene) => {
    //new Renderer(scene.getEngine(), scene);
    Renderer.initAndGetInstance(scene.getEngine(), scene);
    this._engine = scene.getEngine();
  };

  /**
   * Will run on every frame render.  We are spinning the box on y-axis.
   */
  onRender = (scene: Scene) => {
    
    if (this.box !== undefined) {
      //const deltaTimeInMillis = scene.getEngine().getDeltaTime();
      // const rpm = 10;
      // this.box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    }
    this.fpsRef.current.innerHTML = this._engine.getFps().toFixed()+' IPS';
  };
  render() {
    return (
      <>
        <div id="fps-meter" ref={this.fpsRef}>0 FPS</div>
        
        <div id="loadingScreen">
          <div className="conteneur">
            <div className="div3d">
              <img src={lgmLogo} alt="LGM3DLogo" />
            </div>
            Chargement ...
            <div className="havok">
              <p>Powered by</p>
              <img src={havokLogo} alt="Havok logo" />
            </div>
          </div>
        </div>
        
        <SceneComponent antialias onSceneReady={this.onSceneReady} onRender={this.onRender} id="canvas-render" />
      </>
    );
  }
}
