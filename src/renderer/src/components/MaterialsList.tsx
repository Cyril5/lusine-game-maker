import { useMaterialIds } from "@renderer/editor/EditorStore";
import AssetsManager from "@renderer/engine/lgm3D.AssetsManager";
import { Button } from "react-bootstrap";
import MaterialModal from "./Modals/MaterialModal";
import { useState } from "react";

const MaterialsList = () => {
  const [showMatModal, setShowMatModal] = useState(false);

  const ids = useMaterialIds();
  const materials = ids.map((id) => AssetsManager._materials.get(id));

  const openModal = () => setShowMatModal(true);
  const closeModal = () => setShowMatModal(false);

  return (
    <>
      <div className="materialsList">
        {materials.map((mat) =>
          mat ? (
            <div className="materialItem" key={mat.uniqueId}>
              <Button variant="secondary" onClick={openModal}>
                {mat.name}
              </Button>
            </div>
          ) : null
        )}
      </div>

      <MaterialModal show={showMatModal} onHide={closeModal} />
    </>
  );
};
export default MaterialsList;
