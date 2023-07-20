export interface IStateFile {

    filename : string | undefined;
    /**
    * Fichier du code JavaScript de l'état.
    */
    codeFilename : string | undefined;

    /**
    * Le code sera chargé depuis le fichier JavaScript (.state) ?.
    */
    needToLoad : boolean;

    outputCode : string;// = 'console.log(this.gameObject); console.log(this.test);';
    // constructor(filename?:string) {
    //     if(filename) {
    //         this.filename = filename;
    //         //Editor.addStateFileToList(this);
    //     }
    // }

    // getFileName() {
    //     return filename;
    // }
}