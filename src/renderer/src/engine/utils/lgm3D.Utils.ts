import { Matrix, Vector3 } from "@babylonjs/core";

export default class Utils {

    static readonly RB_COMPONENT_TYPE: string = "Rigidbody";
    static readonly COLLIDER_COMPONENT_TYPE: "Collider";
    static readonly BX_COLL_COMPONENT_TYPE: string = "BoxCollider";
    static readonly SPHERE_COLL_COMPONENT_TYPE: string = "SphereCollider"
    static readonly FSM_COMPONENT_TYPE: string = "FiniteStateMachine";

    static convertImgToBase64URL(imageData, type: 'png' | 'jpeg'): string {

        // const base64Image = Buffer.from(imageData).toString('base64');
        // return `data:image/${type};base64,${base64Image}`;

        const blob = new Blob([imageData], { type: "image/png" });
        return URL.createObjectURL(blob);
    }

    /*
    * Vérifie si le vecteur est uniforme
    */
    static isAbsVector3Uniform(v: Readonly<Vector3>) {
        return Math.abs(v.x) === Math.abs(v.y) && Math.abs(v.y) === Math.abs(v.z);
    }

    static matrixAlmostEqual(a: Matrix, b: Matrix, eps = 1e-4) {
        const am = a.m, bm = b.m;
        for (let i = 0; i < 16; i++)
            if (Math.abs(am[i] - bm[i]) > eps) return false;
        return true;
    }

    static vector3Equals(a: Vector3, b: Vector3, eps = 1e-4) {
        // eps est la tolérance car par exemple 0.30000001 est différent de 0.3
        return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps && Math.abs(a.z - b.z) <= eps;
    }
}