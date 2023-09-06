import React, { Component } from "react";
import { Scene, Mesh } from "@babylonjs/core";
import SceneComponent from "./SceneComponent"; // uses above component in same directory
import { Renderer } from "../engine/Renderer";
import '@babylonjs/inspector';
// import 'babylonjs-loaders';
import '@babylonjs/loaders/OBJ/objFileLoader';

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

export default class RendererComponent extends Component {

  box: Mesh;

  onSceneReady = (scene: Scene) => {
    //new Renderer(scene.getEngine(), scene);
    Renderer.initAndGetInstance(scene.getEngine(), scene);
  };

  /**
   * Will run on every frame render.  We are spinning the box on y-axis.
   */
  onRender = (scene: Scene) => {
    if (this.box !== undefined) {
      const deltaTimeInMillis = scene.getEngine().getDeltaTime();

      // const rpm = 10;
      // this.box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    }
  };
  render() {
    return (
      <>
        <SceneComponent antialias onSceneReady={this.onSceneReady} onRender={this.onRender} id="canvas-render" />
      </>
    );
  }
}
