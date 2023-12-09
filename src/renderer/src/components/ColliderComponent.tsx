import { Component, ReactNode, useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import Editor from "./Editor";

const ColliderComponent = (gameObjectId) => {

    const gameObjectRef = useRef(null);

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
        }
    }, [gameObjectId])

    return (
        <>
            <Form.Check type="switch" id="istrigger-switch" label="Est un déclencheur" />
            Appel l'évenement de <Form.Select aria-label="Default select example">
                <option value="1">L'objet programmable parent</option>
                <option value="2">L'objet programmable racine</option>
                {/* <option value="3">Tous les objets programmable parent</option> */}
                <option>Aucun</option>
            </Form.Select>
        </>
    )
}
export default ColliderComponent;