import { Game } from "../Game";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Component from "../lgm3D.Component";

export default class RotateTowardsBehaviour extends Component {

    //public static readonly COMPONENT_NAME = "LGM3D_RotateTowardsBehaviour";

    public update(dt: number): void {
        throw new Error("Method not implemented.");
    }

    lookAtSpeed = (target : BABYLON.Vector3 | BABYLON.TransformNode, axis : string = "XYZ", speed : number)=>{

        if(!this._gameObject.transform.rotationQuaternion)
            this._gameObject.transform.rotationQuaternion = BABYLON.Quaternion.Identity();

        const globalTargetPosition = target instanceof BABYLON.TransformNode ? target.getAbsolutePosition() : target;
        const globalSourcePosition = this._gameObject.transform.getAbsolutePosition();
    
        // Calculer la direction vers la cible
        const direction = globalTargetPosition.subtract(globalSourcePosition).normalize();

        // Calculer les angles nécessaires pour faire face à la cible dans les trois dimensions
        const targetRotationX = Math.atan2(-direction.y, Math.sqrt(direction.z * direction.z + direction.x * direction.x)); // Angle vertical
        const targetRotationY = Math.atan2(direction.x, direction.z); // Angle horizontal
        
        let currentParentRotationX : number;
        let currentParentRotationY: number;
        let relativeRotationX = targetRotationX;
        let relativeRotationY = targetRotationY;

        // Calculer la rotation actuelle du parent
        if(this._gameObject!.transform.parent){
            currentParentRotationX = this._gameObject!.transform.parent.rotationQuaternion.toEulerAngles().x;
            currentParentRotationY = this._gameObject!.transform.parent.rotationQuaternion.toEulerAngles().y;
            relativeRotationX = targetRotationX - currentParentRotationX;
            relativeRotationY = targetRotationY - currentParentRotationY;
        }
    
        // Ajuster les angles de rotation pour tenir compte de la rotation du parent
    
        // Appliquer les rotations à la tourelle
        const targetRot = BABYLON.Quaternion.RotationYawPitchRoll(relativeRotationY, relativeRotationX, 0);

        //alert(this._gameObject.transform.rotationQuaternion);
    
        (this._gameObject as ProgrammableGameObject).setRotationQuaternion(BABYLON.Quaternion.Slerp(this._gameObject.transform.rotationQuaternion,targetRot,speed * Game.deltaTime));
    }

    lookAt = (target : BABYLON.Vector3,axis)=>{



    }

    constructor() {
        super();
    }
}