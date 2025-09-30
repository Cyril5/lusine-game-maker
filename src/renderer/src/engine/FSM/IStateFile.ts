export class IStateFile {
  clsName: string | null; // Nom de la classe
  filename: string | null = null; // fichier du workspace de blocks 
  codeFilename: string | null = null; // fichier du script; 
  outputCode: string = "";     // contiendra le TypeScript complet du state
  language: "ts" | "js" = "ts";
  constructor(name: string) { this.clsName = name; }
}