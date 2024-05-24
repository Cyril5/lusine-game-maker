import { TransformNode } from "babylonjs";
import EditorUtils from "./EditorUtils";

export default class OriginAxis {

    private size : number = 4;

    constructor(scene) {

        const axisOrigin : TransformNode = new TransformNode('_AXIS_EDITOR_',scene);

        axisOrigin.doNotSerialize = true;

        const makeTextPlane = (text, color)=> {
            let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
            let plane = new BABYLON.Mesh.CreatePlane("TextPlane", this.size, scene, true);
            plane.material = new BABYLON.StandardMaterial("_EDITOR_TextPlaneMaterial_", scene);
            
            plane.material.doNotSerialize = true;
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };
    
        const axisX = BABYLON.Mesh.CreateLines("_EDITOR_AXIS_X_", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(this.size, 0, 0), new BABYLON.Vector3(this.size * 0.95, 0.05 * this.size, 0),
            new BABYLON.Vector3(this.size, 0, 0), new BABYLON.Vector3(this.size * 0.95, -0.05 * this.size, 0)
        ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        axisX.setParent(axisOrigin);

        const xChar = makeTextPlane("X", "red", this.size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * this.size, -0.05 * this.size, 0);
        xChar.name = "_EDITOR_AXIS_X_TEXT_";
        xChar.doNotSerialize = true;


        const axisY = BABYLON.Mesh.CreateLines("_EDITOR_AXIS_Y_", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, this.size, 0), new BABYLON.Vector3(-0.05 * this.size, this.size * 0.95, 0),
            new BABYLON.Vector3(0, this.size, 0), new BABYLON.Vector3(0.05 * this.size, this.size * 0.95, 0)
        ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        axisY.setParent(axisOrigin);
        axisY.doNotSerialize = true;

        const yChar = makeTextPlane("Y", "green", this.size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * this.size, -0.05 * this.size);
        yChar.setParent(axisOrigin);
        yChar.name = '_EDITOR_AXIS_Y_TEXT_';
        axisY.doNotSerialize = true;

        const axisZ = BABYLON.Mesh.CreateLines("_EDITOR_AXIS_Z_", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, this.size), new BABYLON.Vector3(0, -0.05 * this.size, this.size * 0.95),
            new BABYLON.Vector3(0, 0, this.size), new BABYLON.Vector3(0, 0.05 * this.size, this.size * 0.95)
        ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        axisZ.setParent(axisOrigin);
        axisZ.doNotSerialize = true;

        const zChar = makeTextPlane("Z", "blue", this.size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * this.size, 0.9 * this.size);
        zChar.setParent(axisOrigin);
        zChar.name = "_EDITOR_AXIS_Z_TEXT_";
        zChar.doNotSerialize = true;

        BABYLON.Tags.AddTagsTo(axisOrigin,EditorUtils.EDITOR_TAG);
    }
}


