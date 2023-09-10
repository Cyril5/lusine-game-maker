import { Component, ReactNode, useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import Editor from "./Editor";

const TransformComponent = (gameObjectId) => {

    const gameObjectRef = useRef(null);
    const [goTransformPos, setGOTransformPos] = useState({ 'x': 0, 'y': 0, 'z': 0 });
    const [goTransformRot, setGOTransformRot] = useState(new BABYLON.Vector3());
    const [goTransformScale, setGOTransformScale] = useState(new BABYLON.Vector3());

    useEffect(()=>{
        // Evenement Quand on bouge l'objet avec le gizmo  
        const posGizmo = Editor.getInstance().getGizmo('POS');

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


    },[])

    useEffect(() => {
        const go = Editor.getInstance().selectedGameObject;
        if (go) {
            gameObjectRef.current = go;
            // met à jour la position dans le composant
            handleSetPosition();
            setGOTransformRot(gameObjectRef.current.rotation);
        }
    }, [gameObjectId])


    const handleSetPosition = (x: number | null = null, y: number | null = null, z: number | null = null) => {
        const pos = gameObjectRef.current.position;
        gameObjectRef.current.position = new BABYLON.Vector3(
            (x ? x : pos.x),
            (y ? y : pos.y),
            (z ? z : pos.z)
        );
        setGOTransformPos(gameObjectRef.current.position);
    }

    const handleSetRotation = (event) => {
        const rot = gameObjectRef.current.rotation;
        gameObjectRef.current.rotation = new BABYLON.Vector3(
            0,
            BABYLON.Tools.ToRadians(event.target.value),
            0
        );
        setGOTransformRot({ 'x': gameObjectRef.current!.rotation.x, 'y': gameObjectRef.current!.rotation.y, 'z': gameObjectRef.current!.rotation.z });
    }

    const handleSetScale = (x: number | null = null, y: number | null = null, z: number | null = null) => {
        const scale = gameObjectRef.current.scaling;
        gameObjectRef.current.rotation = new BABYLON.Vector3(
            (x ? x : scale.x),
            (y ? y : scale.y),
            (z ? z : scale.z)
        );
        setGOTransformScale({ 'x': gameObjectRef.current!.scaling.x, 'y': gameObjectRef.current!.scaling.y, 'z': gameObjectRef.current!.scaling.z });
    }

    return (
        <>
            <div className="transform-positions">
                <p className="x-axis">X <Form.Control type="number" value={goTransformPos.x} onChange={(e) => { handleSetPosition(e.target.value, null, null) }} /></p>
                <p className="y-axis">Y <Form.Control type="number" value={goTransformPos.y} onChange={(e) => { handleSetPosition(null, e.target.value, null) }} /></p>
                <p className="z-axis">Z <Form.Control type="number" value={goTransformPos.z} onChange={(e) => { handleSetPosition(null, null, e.target.value) }} /></p>
            </div>
            <div className="transform-rotations">
                {/* <p className="x-axis">Rot X</p> <Form.Control type="text" value={goTransformRot.x} onChange={(e) => { handleSetRotation(e.target.value, null, null) }} /> */}
                <p className="y-axis">Rot Y</p> <Form.Control type="number" onChange={handleSetRotation} />
                {/* <p className="z-axis">Rot Z</p> <Form.Control type="text" value={goTransformRot.z} onChange={(e) => { handleSetRotation(null, null, e.target.value) }} /> */}
            </div>
        </>
    )
}
export default TransformComponent;