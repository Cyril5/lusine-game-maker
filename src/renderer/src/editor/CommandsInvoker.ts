type Listener = (state: { canUndo: boolean; canRedo: boolean }) => void;

export class CommandsInvoker {
  private history: ICommand[] = [];
  private index = -1;
  private listeners = new Set<Listener>();
  private limit = 500; // historique max (optionnel)

  subscribe(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }

  private notify() { 
    console.log("CAN UNDO "+this.canUndo);
    const s = { canUndo: this.canUndo, canRedo: this.canRedo };
    this.listeners.forEach(l => l(s));
  }

  get canUndo() { return this.index >= 0; }
  get canRedo() { return this.index < this.history.length - 1; }

  executeCommand(command: ICommand): void {
    // coupe la branche future
    if (this.index < this.history.length - 1) this.history.splice(this.index + 1);

    // coalescing (optionnel)
    const last = this.history[this.history.length - 1];
    // if (last?.mergeWith && last.mergeWith(command)) { this.notify(); return; }

    command.execute();
    this.history.push(command);
    if (this.history.length > this.limit) { this.history.shift(); this.index--; }
    this.index++;
    this.notify();
  }

  undo(): void {
    if (!this.canUndo) return;
    console.log("UNDO");
    this.history[this.index].undo();
    this.index--;
    this.notify();
  }

  redo(): void {
    if (!this.canRedo) return;
    this.index++;
    this.history[this.index].redo();
    this.notify();
  }

  clear(): void {
    this.history.length = 0;
    this.index = -1;
    this.notify();
  }
}

// singleton à partager
export const commands = new CommandsInvoker();