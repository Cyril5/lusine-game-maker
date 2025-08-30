import React from "react";
import { DockContext, Placement } from "./DockDesk";

export const DockableWindowPanel: React.FC<Props> = ({ id, title, children, initialPlacement }) => {
  const desk = React.useContext(DockContext);

  // Mount / unmount
  React.useEffect(() => {
    if (!desk) return;
    desk.register({
      id,
      title,
      node: children,
      initialPlacement: initialPlacement ?? { mode: "dock", zone: "center" },
    });
    return () => desk.unregister(id);
  }, [desk, id]); // ← seulement au mount

  // Updates de contenu/titre
  React.useEffect(() => {
    if (!desk) return;
    desk.update(id, { title, node: children });
  }, [desk, id, title, children]);

  return null;
};
