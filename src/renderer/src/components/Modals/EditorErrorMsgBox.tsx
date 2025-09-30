import { useEffect, useMemo, useReducer, useState } from "react";
import { Offcanvas, Alert, Col, Row, Badge, Button, ListGroup } from "react-bootstrap";
import errorImg from "@renderer/assets/error-icon.png";

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (channel: string, listener: (...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      };
    };
  }
}

type ErrorData = {
  message: string;
  sourceId: string;
  line: number;
  ts?: number; // timestamp ms
  id?: string; // uid
};

type State = {
  show: boolean;
  items: ErrorData[];
};

type Action =
  | { type: "PUSH"; payload: ErrorData }
  | { type: "DISMISS"; id: string }
  | { type: "CLEAR" }
  | { type: "SHOW"; value: boolean };

const MAX_ITEMS = 50;
const DEDUP_MS = 5000;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PUSH": {
      const now = Date.now();
      const item: ErrorData = {
        ...action.payload,
        ts: now,
        id: uid(),
      };

      // de-dup (même message/source/line récent)
      const same = state.items.find(
        (e) =>
          e.message === item.message &&
          e.sourceId === item.sourceId &&
          e.line === item.line &&
          (item.ts! - (e.ts || 0)) <= DEDUP_MS
      );
      if (same) {
        return { ...state, show: true }; // ne pas re-empiler, juste s'assurer visible
      }

      const items = [item, ...state.items].slice(0, MAX_ITEMS);
      return { show: true, items };
    }
    case "DISMISS": {
      const items = state.items.filter((e) => e.id !== action.id);
      return { ...state, items, show: items.length > 0 && state.show };
    }
    case "CLEAR":
      return { show: false, items: [] };
    case "SHOW":
      return { ...state, show: action.value };
    default:
      return state;
  }
}

export default function ErrorCenter() {
  const [state, dispatch] = useReducer(reducer, { show: false, items: [] });

  useEffect(() => {
    const handler = (_event: unknown, data: ErrorData) => {
      dispatch({ type: "PUSH", payload: data });
    };
    window.electron.ipcRenderer.on("console-error", handler);
    return () => window.electron.ipcRenderer.removeListener("console-error", handler);
  }, []);

  const count = state.items.length;
  const latest = state.items[0];

  // Titre dynamique
  const title = useMemo(
    () => (
      <>
        Erreurs <Badge bg="danger">{count}</Badge>
        <Button variant="outline-danger" size="sm" onClick={() => dispatch({ type: "CLEAR" })}>
          Clear all
        </Button>
      </>
    ),
    [count]
  );

  return (
    <Offcanvas
      show={state.show}
      onHide={() => dispatch({ type: "SHOW", value: false })}
      backdrop={false}
      placement="top"
      style={{ height: "auto", maxHeight: "25vh", overflow: "hidden" }}
      scroll
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>{title}</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body style={{ overflowY: "auto" }}>
        {/* Bandeau “dernière erreur” */}
        {latest && (
          <Row className="align-items-center mb-3">
            <Col xs="auto">
              <img src={errorImg} width="88" alt="Erreur" />
            </Col>
            <Col>
              <Alert variant="danger" className="mb-2">
                <strong>Message :</strong> {latest.message}
              </Alert>
              <p className="mb-1">
                <strong>Source :</strong> {latest.sourceId}
              </p>
              <p className="mb-0">
                <strong>Ligne :</strong> {latest.line}
              </p>
            </Col>
            <Col xs="auto">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => dispatch({ type: "DISMISS", id: latest.id! })}
              >
                Dismiss
              </Button>
            </Col>
          </Row>
        )}

        {/* Liste scrollable des erreurs (toutes) */}
        <ListGroup>
          {state.items.map((e) => (
            <ListGroup.Item key={e.id} className="d-flex justify-content-between align-items-start">
              <div className="me-3">
                <div className="fw-bold">{e.message}</div>
                <small>
                  {e.sourceId} : {e.line} — {new Date(e.ts || 0).toLocaleTimeString()}
                </small>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => dispatch({ type: "DISMISS", id: e.id! })}>
                Dismiss
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="outline-secondary" size="sm" onClick={() => dispatch({ type: "SHOW", value: false })}>
            Masquer
          </Button>

        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}