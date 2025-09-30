export class IStateFile {

    name : string | null;
    filename : string | null = null;
    /**
    * Fichier du code JavaScript de l'état.
    */
    codeFilename : string | null = null;

    /**
    * Le code sera chargé depuis le fichier JavaScript ? (.state).
    */
    needToLoad : boolean = false;

    outputCode : string = "";// = 'console.log(this.gameObject); console.log(this.test);';
    
    constructor(name :string) {
        this.name = name;
    }

    // getFileName() {
    //     return filename;
    // }
}