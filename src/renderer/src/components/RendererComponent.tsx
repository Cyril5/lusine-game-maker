import React, { Component } from "react";
import { FreeCamera, Vector3, HemisphericLight, MeshBuilder, Scene, Mesh, ArcRotateCamera, SceneLoader } from "@babylonjs/core";
import SceneComponent from "./SceneComponent"; // uses above component in same directory
import { Renderer } from "../engine/Renderer";
import '@babylonjs/inspector';
// import 'babylonjs-loaders';
import '@babylonjs/loaders/OBJ/objFileLoader';
import { TransformComponent } from "@renderer/engine/TransformComponent";

// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.

export default class Editor extends Component {

  box: Mesh;

  onSceneReady = (scene: Scene) => {


    const camera: ArcRotateCamera = new ArcRotateCamera("Camera", 0, 0, 10, Vector3.Zero(), scene);

    camera.setPosition(new Vector3(0, 0, -10));

    const canvas = scene.getEngine().getRenderingCanvas();

    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

    scene.debugLayer.show();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    //new Renderer(scene.getEngine(), scene);
    Renderer.initAndGetInstance(scene.getEngine(), scene);
  };

  /**
   * Will run on every frame render.  We are spinning the box on y-axis.
   */
  onRender = (scene: Scene) => {
    if (this.box !== undefined) {
      const deltaTimeInMillis = scene.getEngine().getDeltaTime();

      const rpm = 10;
      this.box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
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
