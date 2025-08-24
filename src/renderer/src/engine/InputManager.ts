/// InputManager : Version 0.3

export enum KeyCode {
    A='',B='',C='',D='d',E='',F='',G='',H='',I='',J='',K='',
    L='',M='',N='',O='',P='',Q='q',R='',S='s',T='',U='',V='',W='',X='',Y='',Z='z',
    Escape='escape',Space='space'
}

export class InputKeyStruct {
    keyPressed:boolean = false;
    timer : any = null;
    states = {
        keyPressed:false,
        keyDown:false
    }
}
import { Observable } from "@babylonjs/core";

export default class InputManager {

  static _instance: InputManager;
  static getInstance(): InputManager {
      if(!InputManager._instance)
        this._instance = new InputManager();
      return this._instance;
  }

  public onKeyDown = new Observable<KeyboardEvent>();
  public onKeyUp   = new Observable<KeyboardEvent>();
  public onKeyHeld = new Observable<Set<string>>();

  private pressed = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this._handleDown);
    window.addEventListener("keyup", this._handleUp);
    //window.addEventListener("blur", () => this.pressed.clear());
  }

  dispose() {
    window.removeEventListener("keydown", this._handleDown);
    window.removeEventListener("keyup", this._handleUp);
  }

  private _handleDown = (ev: KeyboardEvent) => {
    const key = ev.key.toLowerCase();
    if (!this.pressed.has(key)) {
      this.pressed.add(key);
      this.onKeyDown.notifyObservers(ev);
    }
    this.onKeyHeld.notifyObservers(this.pressed);
  };

  private _handleUp = (ev: KeyboardEvent) => {
    const key = ev.key.toLowerCase();
    if (this.pressed.delete(key)) {
      this.onKeyUp.notifyObservers(ev);
    }
    this.onKeyHeld.notifyObservers(this.pressed);
  };

  isDown(key: string) {
    return this.pressed.has(key.toLowerCase());
  }
}