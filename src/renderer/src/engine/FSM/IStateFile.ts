export class StateFile {
  clsName: string | null; // Nom de la classe
  filename: string | null = null; // fichier du workspace de blocks 
  codeFilename: string | null = null; // fichier du script; 
  outputCode: string = "";     // contiendra le TypeScript complet du state
  language: "ts" | "js" = "ts";
  private static _stateFiles : Map<string, StateFile> = new Map<string, StateFile>();
  
  static getStateFiles(){
    return StateFile._stateFiles;
  }
  
  constructor(clsName: string) {
    StateFile._stateFiles.set(clsName, this);
    this.clsName = clsName; 
  }
}