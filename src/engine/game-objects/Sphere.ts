import { MeshBuilder } from "@babylonjs/core";
import { GameObject } from "../GameObject";

export class Sphere extends GameObject {
    
    constructor() {
        super("Sphere");
        const mesh = MeshBuilder.CreateSphere(this._transform.name);
        mesh.parent = this._transform;
    }
}