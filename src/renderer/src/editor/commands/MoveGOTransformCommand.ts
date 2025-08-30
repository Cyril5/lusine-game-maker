import { GameObject } from "@renderer/engine/GameObject";
import { applySnapshot, TransformSnapshot } from "../snapshots/TransformSnapshot";

export class MoveGOTransformCommand implements ICommand {
  constructor(
    private go: GameObject,
    private before: TransformSnapshot,
    private after: TransformSnapshot
  ) {}

  execute() { applySnapshot(this.go, this.after); } // première exécution = état final
  undo()    { applySnapshot(this.go, this.before); }
  redo()    { applySnapshot(this.go, this.after); }
}