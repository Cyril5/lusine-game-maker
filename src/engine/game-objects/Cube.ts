import { Mesh, MeshBuilder, Scene } from "@babylonjs/core";

export class Cube  {

    constructor(scene : Scene) {
        
        MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

    }
}