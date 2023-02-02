import THREE from "three";

export default class Vector3D extends THREE.Vector3 {

    constructor(x:number,y:number,z:number) {
        super(x,y,z);
    }

    static right() {
        return new THREE.Vector3(1,0,0);
    }
    
    static up() {
        return new THREE.Vector3(0,1,0);
    }

    static forward() {
        return new THREE.Vector3(0,0,1);
    }

}