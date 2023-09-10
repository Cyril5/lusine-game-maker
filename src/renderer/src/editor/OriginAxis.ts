export default class OriginAxis {

    private size : number = 4;

    constructor(scene) {
        const makeTextPlane = (text, color)=> {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
            var plane = new BABYLON.Mesh.CreatePlane("TextPlane", this.size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };
    
        const axisX = BABYLON.Mesh.CreateLines("axisX", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(this.size, 0, 0), new BABYLON.Vector3(this.size * 0.95, 0.05 * this.size, 0),
            new BABYLON.Vector3(this.size, 0, 0), new BABYLON.Vector3(this.size * 0.95, -0.05 * this.size, 0)
        ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        const xChar = makeTextPlane("X", "red", this.size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * this.size, -0.05 * this.size, 0);
        const axisY = BABYLON.Mesh.CreateLines("axisY", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, this.size, 0), new BABYLON.Vector3(-0.05 * this.size, this.size * 0.95, 0),
            new BABYLON.Vector3(0, this.size, 0), new BABYLON.Vector3(0.05 * this.size, this.size * 0.95, 0)
        ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        const yChar = makeTextPlane("Y", "green", this.size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * this.size, -0.05 * this.size);
        const axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, this.size), new BABYLON.Vector3(0, -0.05 * this.size, this.size * 0.95),
            new BABYLON.Vector3(0, 0, this.size), new BABYLON.Vector3(0, 0.05 * this.size, this.size * 0.95)
        ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        const zChar = makeTextPlane("Z", "blue", this.size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * this.size, 0.9 * this.size);
    }
}


