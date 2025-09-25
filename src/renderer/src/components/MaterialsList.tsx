import { useMaterialIds } from "@renderer/editor/EditorStore";
import AssetsManager from "@renderer/engine/lgm3D.AssetsManager";
import { Button } from "react-bootstrap";
import MaterialModal from "./Modals/MaterialModal";
import { useMemo, useState } from "react";

const MaterialsList = () => {
  const [showMatModal, setShowMatModal] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState<number | null>(null);

  const ids = useMaterialIds();

  // Optionnel: mémo pour éviter de recalculer à chaque render
  const materials = useMemo(
    () => ids.map((id) => AssetsManager.getMaterialById(id)).filter((m): m is NonNullable<typeof m> => !!m),
    [ids]
  );

  const openModal = (id: number) => {
    setSelectedMatId(id);
    setShowMatModal(true);
  };

  const closeModal = () => {
    setShowMatModal(false);
    setSelectedMatId(null);
  };

  return (
    <>
      <div className={`materialsList ${showMatModal ? "shrinked" : ""}`}>
        {materials.map((mat) => (
          <div className="materialItem" key={mat.uniqueId as number}>
            <Button variant="secondary" onClick={() => openModal(mat.uniqueId as number)}>
              {mat.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Ne monte la modal que si un matériau est sélectionné */}
      {selectedMatId !== null && (
        <MaterialModal
          show={showMatModal}
          onHide={closeModal}
          matId={selectedMatId}
          onChangeMatId={(id) => setSelectedMatId(id)}
        />
      )}
    </>
  );
};

export default MaterialsList;
