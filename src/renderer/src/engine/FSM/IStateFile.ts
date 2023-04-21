export interface IStateFile {

    filename : string | undefined;
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