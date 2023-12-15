import { useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import Editor from "./Editor";

const PhysicComponent = (gameObjectId) => {

    const gameObjectRef = useRef(null);
    
    const [physicsEnable, setPhysicsEnabled] = useState(false);
    const [mass, setMass] = useState(1);
    const [restitution, setRestitution] = useState(0.2);
    const [friction, setFriction] = useState(0.5);

    useEffect(() => {

        // ['x', 'y', 'z'].forEach(axis => {
        //     posGizmo![axis + 'Gizmo'].dragBehavior.onDragObservable.add(() => {
        //         handleSetPosition();
        //     });
        // });

        // const rotGizmo = Editor.getInstance().getGizmo('ROT');
        // rotGizmo!.xGizmo.dragBehavior.onDragObservable.add(()=>{
        //     handleSetRotation();
        // });
        // rotGizmo!.yGizmo.dragBehavior.onDragObservable.add(()=>{
        //     handleSetRotation();
        // });
        // rotGizmo!.zGizmo.dragBehavior.onDragObservable.add(()=>{
        //     handleSetRotation();
        // });


    }, [])

    useEffect(() => {
        const go = Editor.getInstance().selectedGameObject;
        if (go) {
            gameObjectRef.current = go;
            setPhysicsEnabled(go.rigidbody != null);
        }
    }, [gameObjectId]);


    const handleEnablePhysics = (e : any)=>{
        const active = e.target.checked;
        if(active) {
            gameObjectRef.current.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
        }else{
            gameObjectRef.current.removeRigidbody();
        }
        setPhysicsEnabled(active);
        
    };

    const handleSetMass = ((e: any) => {
        const newGameObjectName = e.target.value;
        setMass(newGameObjectName);
    });

    const handleSetRestitution = ((e: any) => {
        const newGameObjectName = e.target.value;
        setRestitution(newGameObjectName);
    });

    const handleSetFriction = ((e: any) => {
        const newGameObjectName = e.target.value;
        setFriction(newGameObjectName);
    });


    return (
        <>
            <Form.Check type="switch" id="enable-phsyic-switch" checked={physicsEnable} onChange={handleEnablePhysics} label="Activé" />
            <Form.Group className="mb-3">
                <Form.Label>Masse (kg)</Form.Label>
                <Form.Control type="number" onChange={handleSetMass} value={mass} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Restitution</Form.Label>
                <Form.Control type="number" onChange={handleSetMass} value={restitution} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Friction</Form.Label>
                <Form.Control type="number" onChange={handleSetFriction} value={friction} />
            </Form.Group>
            <Form.Check type="switch" id="gravity-switch" label="Gravité" defaultChecked={true} />
        </>
    )
}
export default PhysicComponent;