import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Form, InputGroup } from "react-bootstrap";
import { FiniteStateMachine } from "@renderer/engine/FSM/lgm3D.FiniteStateMachine";
import { FSMVariable, FSMVarType } from "@renderer/engine/FSM/lgm3D.FSMVariable";

type Props = { fsm: FiniteStateMachine };

const TYPE_LABEL: Record<FSMVarType, string> = {
  number: "Nombre",
  text: "Texte",
  boolean: "Booléen",
};

export default function FSMVariablesPanel({ fsm }: Props) {
  // on garde une copie immuable pour déclencher les renders,
  // et on réécrit dans fsm.Variables à chaque modif
  const [varsList, setVarsList] = useState<FSMVariable[]>([]);

  // sync initiale + quand la fsm change
  useEffect(() => {
    setVarsList(Array.from(fsm.Variables.values()));
  }, [fsm]);

  // helpers de mise à jour locale + modèle
  const commit = () => setVarsList(Array.from(fsm.Variables.values()));

  const handleAdd = () => {
    // nom auto simple, libre à toi d’ouvrir un prompt/Modal
    fsm.addVariable(`var_${varsList.length + 1}`, "number", 0);
    commit();
  };

  const handleDelete = (id: string) => {
    fsm.removeVariable(id);
    commit();
  };

  const handleRename = (id: string, name: string) => {
    fsm.updateVariable(id, { name });
    commit();
  };

  const handleTypeChange = (id: string, type: FSMVarType) => {
    const cur = fsm.Variables.get(id);
    if (!cur) return;
    // reset valeur selon le type
    const resetVal = type === "number" ? 0 : type === "boolean" ? false : "";
    fsm.updateVariable(id, { type, value: resetVal });
    commit();
  };

  const handleValueChange = (id: string, raw: string | boolean) => {
    const v = fsm.Variables.get(id);
    if (!v) return;
    let val: number | string | boolean = raw;

    if (v.type === "number") {
      const n = Number(raw);
      if (!Number.isNaN(n)) val = n;
    } else if (v.type === "boolean") {
      val = Boolean(raw);
    } else {
      val = String(raw);
    }
    fsm.updateVariable(id, { value: val });
    commit();
  };

  return (
    <div className="fsm-variables-panel">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="fw-bold">Variables ({varsList.length})</div>
        <Button size="sm" variant="primary" onClick={handleAdd}>Ajouter</Button>
      </div>

      {varsList.length === 0 && (
        <div className="text-muted">Aucune variable. Clique sur “Ajouter”.</div>
      )}

      {varsList.map(v => (
        <div key={v.id} className="p-2 border rounded mb-2">
          {/* Nom */}
          <InputGroup className="mb-2">
            <InputGroup.Text>Nom</InputGroup.Text>
            <Form.Control
              value={v.name}
              onChange={e => handleRename(v.id, e.target.value)}
              placeholder="Nom de la variable"
            />
          </InputGroup>

          {/* Type */}
          <InputGroup className="mb-2">
            <InputGroup.Text>Type</InputGroup.Text>
            <Dropdown onSelect={(k) => handleTypeChange(v.id, (k as FSMVarType) ?? v.type)}>
              <Dropdown.Toggle size="sm" variant="secondary">
                {TYPE_LABEL[v.type]}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="number" active={v.type === "number"}>Nombre</Dropdown.Item>
                <Dropdown.Item eventKey="text"   active={v.type === "text"}>Texte</Dropdown.Item>
                <Dropdown.Item eventKey="boolean" active={v.type === "boolean"}>Booléen</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </InputGroup>

          {/* Valeur */}
          {v.type === "boolean" ? (
            <Form.Check
              type="switch"
              id={`bool_${v.id}`}
              label={v.value ? "Vrai" : "Faux"}
              checked={Boolean(v.value)}
              onChange={e => handleValueChange(v.id, e.target.checked)}
            />
          ) : (
            <InputGroup className="mb-2">
              <InputGroup.Text>Valeur</InputGroup.Text>
              <Form.Control
                type={v.type === "number" ? "number" : "text"}
                value={String(v.value)}
                onChange={e => handleValueChange(v.id, e.target.value)}
              />
            </InputGroup>
          )}

          <div className="d-flex justify-content-end">
            <Button size="sm" variant="danger" onClick={() => handleDelete(v.id)}>Supprimer</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
