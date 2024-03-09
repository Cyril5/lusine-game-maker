class CommandsInvoker {
    private history: ICommand[] = [];
    private index: number = -1;

    executeCommand(command: ICommand): void {
        command.execute();
        this.history.splice(this.index + 1);
        this.history.push(command);
        this.index++;
    }

    undo(): void {
        if (this.index >= 0) {
            this.history[this.index].undo();
            this.index--;
        }
    }

    redo(): void {
        if (this.index < this.history.length - 1) {
            this.index++;
            this.history[this.index].redo();
        }
    }
}