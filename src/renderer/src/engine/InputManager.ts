export enum KeyCode {
    A='',B='',C='',D='d',E='',F='',G='',H='',I='',J='',K='',
    L='',M='',N='',O='',P='',Q='q',R='',S='s',T='',U='',V='',W='',X='',Y='',Z='z',
    Escape='escape',Space='space'
}

export default class InputManager {

    private static _keys : Map<string,boolean> = new Map<string,boolean>();

    static initKeyboardListeners() {

        // InputManager._keys.set('90',false);

        // Ajoute des contrôles de clavier
        addEventListener("keydown", (event) => {
            if (event.repeat) {
            }
            const key = event.key;
            if(InputManager._keys.has(key)) {
                InputManager._keys[key] = true;
            }else{
                InputManager._keys.set(key,true);
            }
        });

        addEventListener("keyup", (event) => {
            const keyUp = event.key;
            if(InputManager._keys.has(keyUp)) {
                InputManager._keys[keyUp] = false;
            }
        });
    }

    static removeKeyboardListeners() {
        // TODO : Enlever les listeners de l'inputManager mais pas celui du document
        // car celà enlève les controles sur l'éditeur 

        // document.onkeydown = ()=>{};
        // document.onkeyup = ()=>{};
    }

    static getKeyDown(key : KeyCode) {
        // console.log(InputManager._keys);
        return InputManager._keys[key]==true;
    }

    static getKeyUp(key: KeyCode) {
        return InputManager._keys[key]==false;
    }

}