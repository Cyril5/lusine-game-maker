import { useEffect, useRef, useState } from "react";
import { Dropdown, DropdownButton, Form } from "react-bootstrap";
import Editor from "../Editor";
import Rigidbody from "@renderer/engine/physics/lgm3D.Rigidbody";

const PhysicComponent = (gameObjectId) => {

  const rigidbodyRef = useRef<Rigidbody>(null);

  const [physicsMotionType, setPhysicsMotionType] = useState<string | null>(null);
  const [motionTypeTitle, setMotionTypeTitle] = useState("Aucun");
  const [mass, setMass] = useState(1);
  const [restitution, setRestitution] = useState(0);
  const [friction, setFriction] = useState(0.2);

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
      rigidbodyRef.current = go.getComponent<Rigidbody>("Rigidbody");
      //setPhysicsEnabled(go.rigidbody != null);
      if (rigidbodyRef.current?.body) {
        setMotionTypeTitle(rigidbodyRef.current.body.getMotionType());
        setFriction(rigidbodyRef.current.body.getMassProperties().mass);
        setRestitution(rigidbodyRef.current.body.material.restitution);
      } else {
        setMotionTypeTitle("Aucun");
      }
    }
  }, [gameObjectId]);


  const handleMotionType = (motionType) => {

    switch (motionType) {
      case "DYNAMIC":
        setMotionTypeTitle("Dynamique");
        rigidbodyRef.current!.setPhysicsType(BABYLON.PhysicsMotionType.DYNAMIC);
        break;
      case "KINEMATIC":
        setMotionTypeTitle("Cinématique");
        rigidbodyRef.current!.setPhysicsType(BABYLON.PhysicsMotionType.ANIMATED);
        break;
      default:
        setMotionTypeTitle("Aucun");
        rigidbodyRef.current!.setPhysicsType(null);
        break;
    }
    // const active = e.target.checked;
    // if (active) {
    //     rigidbodyRef.current.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
    // } else {
    //     rigidbodyRef.current.removeRigidbody();
    // }
    // setPhysicsEnabled(active);

  };

  const handleSetMass = ((e: any) => {
    const massValue = e.target.value;
    rigidbodyRef.current.body.setMassProperties({ mass: massValue });
    setMass(massValue);
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
        {rigidbodyRef.current && (
          <>
          Type mouvement
          <DropdownButton id="dropdown-rigidbody-type" title={motionTypeTitle}>
            <Dropdown.Item onClick={() => handleMotionType(null)}>Aucun</Dropdown.Item>
            <Dropdown.Item onClick={() => handleMotionType("DYNAMIC")}>Dynamique</Dropdown.Item>
            <Dropdown.Item onClick={() => handleMotionType("KINEMATIC")}>Cinématique</Dropdown.Item>
          </DropdownButton>
          {rigidbodyRef.current.body?.getMotionType() && (
            <>
            <Form.Group className="mb-3">
              <Form.Label>Masse (kg)</Form.Label>
              <Form.Control
                type="number"
                onChange={handleSetMass}
                value={mass}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Restitution</Form.Label>
              <Form.Control
                type="number"
                onChange={handleSetRestitution}
                value={restitution}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Friction</Form.Label>
              <Form.Control
                type="number"
                onChange={handleSetFriction}
                value={friction}
              />
            </Form.Group>
  
            <Form.Check
              type="switch"
              id="gravity-switch"
              label="Gravité"
              defaultChecked={true}
            />
            </>
          )}


        </>
      )}
    </>
  );
}
export default PhysicComponent;