import { Observable } from "babylonjs";

export class EditorObservable<T> extends Observable<T> {

    constructor() {
        super();
        // nettoyer la liste des méthodes lorsque jeu s'arrête
        // Game.getInstance().onGameStarted.add(()=>{
        //     this.clear();
        // });
    }

}