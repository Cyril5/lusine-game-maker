export default class Vector3D {

    _v: BABYLON.Vector3;

    constructor(x?:number,y?:number,z?:number) {
        this._v = new BABYLON.Vector3(x, y, z);
    }

    

}