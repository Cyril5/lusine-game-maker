export enum KeyCode {
    A='',B='',C='',D='d',E='',F='',G='',H='',I='',J='',K='',
    L='',M='',N='',O='',P='',Q='q',R='',S='s',T='',U='',V='',W='',X='',Y='',Z='z',
    Escape='escape',Space='space'
}

export default class InputManager {

    private static _keys : Map<string,boolean> = new Map<string,boolean>();
    //private static _keys : {};

    static initKeyboardListeners() {

        // InputManager._keys.set('90',false);

        // Ajoute des contrôles de clavier
        addEventListener("keydown", (event) => {
            // if (event.repeat) {
            // }
            const key = event.key;
            InputManager._keys.set(key,true);
            // if(InputManager._keys.has(key)) {
            // }else{
            //     console.log("addkey");
            //     InputManager._keys.set(key,true);
            // }
           // InputManager._keys.set(key] = true;
        });

        addEventListener("keyup", (event) => {
            const keyUp = event.key;
            InputManager._keys.set(keyUp,false);
            // if(InputManager._keys.has(keyUp)) {
            // }
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
        return InputManager._keys.get(key)==true;
    }

    static getKeyUp(key: KeyCode) {
        return InputManager._keys.get(key)==false;
    }

}