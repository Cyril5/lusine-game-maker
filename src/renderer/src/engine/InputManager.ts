/// InputManager : Version 0.2

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

export default class InputManager {

    private static readonly DEADZONE : number = 100; // temps en ms pour détecter la différence entre une touche préssée ou enfoncée

    private static _keys : Map<string,InputKeyStruct> = new Map<string,InputKeyStruct>();

    static initKeyboardListeners() {

        // Ajoute des contrôles de clavier
        addEventListener('keydown', (event) => {


            //if (event.key === 'space') {

                const key = this._keys.get(event.key);
                if(key) {
                    if(!key.keyPressed) {
                        key.keyPressed = true;
                        //console.log(`Touche ${event.key} pressée`);
                        key.states.keyPressed = true;
                        key.timer = setInterval(()=> {
                            // Code à exécuter si la touche est enfoncée pendant un certain délai
                            key.states.keyDown = true;
                            key.states.keyPressed = false;
                            //console.log(`Touche ${event.key} enfoncée`);
                            //console.log("do move");
                        }, InputManager.DEADZONE); // Réglez le délai souhaité en millisecondes (500 ms dans cet exemple)
                    }
                }

            //}
        });

        addEventListener('keyup', (event) => {
            const key = this._keys.get(event.key);
            if (key) {
                key.keyPressed = false;
                key.states.keyPressed = false;
                clearInterval(key.timer);
                key.states.keyDown = false;
                // Code à exécuter si la touche est relâchée avant le délai
               // console.log(`Touche ${event.key} relâchée`);
            }
        })

    }

    static removeKeyboardListeners() {
        // TODO : Enlever les listeners de l'inputManager mais pas celui du document
        // car celà enlève les controles sur l'éditeur 

        // document.onkeydown = ()=>{};
        // document.onkeyup = ()=>{};
    }

    // Si la touche est toujours enfoncée après 100ms
    static getKeyDown(key : KeyCode) {
        this.addKeyToKeysMap(key);
        //console.log(`${InputManager._keys.get(key).states.keyDown}`);
        return InputManager._keys.get(key).states.keyDown === true;
    }

    static getKeyPressed(key : KeyCode) {
        this.addKeyToKeysMap(key);
        //console.log(`${InputManager._keys.get(key).states.keyPressed}`);
        return InputManager._keys.get(key).states.keyPressed === true;
    }

    static getKeyUp(key: KeyCode) {
        return InputManager._keys.get(key)==false;
    }

    private static addKeyToKeysMap(key) {
        //Ajouter la touche à la liste
        if(!this._keys.has(key)) {
            this._keys.set(key,new InputKeyStruct());
        }
    }

}