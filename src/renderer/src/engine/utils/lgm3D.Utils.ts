import * as BABYLON from "@babylonjs/core";

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
    static isAbsVector3Uniform(v: Readonly<BABYLON.Vector3>) {
        return Math.abs(v.x) === Math.abs(v.y) && Math.abs(v.y) === Math.abs(v.z);
    }

    static matrixAlmostEqual(a: BABYLON.Matrix, b: BABYLON.Matrix, eps = 1e-4) {
        const am = a.m, bm = b.m;
        for (let i = 0; i < 16; i++)
            if (Math.abs(am[i] - bm[i]) > eps) return false;
        return true;
    }

    static vector3Equals(a: BABYLON.Vector3, b: BABYLON.Vector3, eps = 1e-4) {
        // eps est la tolérance car par exemple 0.30000001 est différent de 0.3
        return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps && Math.abs(a.z - b.z) <= eps;
    }

    /*
    * Calcule le bounding box global d'un node + tous ses enfants meshes
    */
    public static computeHierarchyBounds(root: BABYLON.Node): {
        center: BABYLON.Vector3;
        size: BABYLON.Vector3;
        radius: number;
    } {
        let min = new BABYLON.Vector3(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY
        );
        let max = new BABYLON.Vector3(
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        );

        let found = false;

        // Parcourt tous les meshes et garde ceux appartenant à la hiérarchie
        for (const mesh of root.getScene().meshes) {
            if (!mesh.isEnabled() || mesh.isDisposed()) continue;
            if (!mesh.isDescendantOf(root) && mesh !== root) continue;

            const bi = mesh.getBoundingInfo();
            const bmin = bi.boundingBox.minimumWorld;
            const bmax = bi.boundingBox.maximumWorld;

            // BabylonJS: on doit utiliser Minimize/Maximize qui retournent une copie
            min = BABYLON.Vector3.Minimize(min, bmin);
            max = BABYLON.Vector3.Maximize(max, bmax);

            found = true;
        }

        // Aucun mesh trouvé → root vide (TransformNode)
        if (!found) {
            const p = (root as any).getAbsolutePosition
                ? (root as any).getAbsolutePosition()
                : BABYLON.Vector3.Zero();

            min = p.subtract(new BABYLON.Vector3(0.5, 0.5, 0.5));
            max = p.add(new BABYLON.Vector3(0.5, 0.5, 0.5));
        }

        const center = min.add(max).scale(0.5);
        const size = max.subtract(min);
        const radius = size.length() * 0.5;

        return { center, size, radius };
    }
}