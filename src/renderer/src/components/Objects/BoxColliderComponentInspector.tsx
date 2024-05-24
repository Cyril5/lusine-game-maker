import { Accordion } from "react-bootstrap";
import { BooleanFieldInspector } from "./FieldsComponentInspector";
import { useEffect, useState } from "react";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";

const BoxColliderInspector = ({componentInstance}) => {

    const [isTrigger,setIsTrigger] = useState(false);
 
    const handleIsTriggerChange = (event) => {
        const checked = event.target.checked;
        setIsTrigger(checked);
        componentInstance.isTrigger = checked;
    };

    useEffect(()=>{
        console.log(componentInstance);
    },[componentInstance])

    return (
            <>
            <Accordion.Header>Boîte de collision</Accordion.Header>
            <Accordion.Body>
                <BooleanFieldInspector label="Fantôme" value={isTrigger} onChange={handleIsTriggerChange}/>
                {/* <BooleanFieldInspector label="Déclencheur?" value={componentInstance.isTrigger} onChange={handleIsTriggerChange}/> */}
            </Accordion.Body>
            </>
    );
};
export default BoxColliderInspector;

// Décorateur pour marquer les composants avec leur représentation React dans l'Inspector
export function InspectorComponent(component: React.ComponentType<any>) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            inspectorComponent = component;
        };
    };
}