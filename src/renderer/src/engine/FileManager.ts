import EditorUtils from "@renderer/editor/EditorUtils";

// import fs from 'fs';
export default abstract class FileManager {

    
    private static fs = require('fs');
    
    private constructor() {
        
    }
    
    static fileIsEmpty(filename: string,afterCheckCallback) : void {
        FileManager.fs.stat(filename, (err, stats) => {
            if (err) {
              console.error(err);
              return true;
            }
            // Vérifiez si la taille du fichier est égale à 0 pour déterminer s'il est vide
            console.log(stats.size);
            
            afterCheckCallback(stats.size === 0);
            
          });
    }
    
    static fileExists(filename: string) : boolean {
       return FileManager.fs.existsSync(filename);
    }
    
    static writeInFile(filename: string, content: string, onSuccess?: () => void) {
        FileManager.fs.writeFile(filename, content, { flag: 'w+' }, err => {
            if (err) {
                console.error(err);
                throw new Error(err.message);
            }
            if (onSuccess) {
                onSuccess();
            }
        });
    }

    static readFile(filename: string | undefined, onSuccess: (data: any) => void) {
        FileManager.fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                throw err;
            }
            onSuccess(data);
        });
    }

    static getDirectoryFiles = (directory,extensions : string[],success) : Array<string> => {
        return FileManager.fs.readdir(directory, (err, files) => {
            if (err) {
                console.error("Erreur lors de la lecture du répertoire :", err);
                throw err;
            }

            // Filtrer les fichiers avec les extensions
            const filteredFiles = files.filter(file => {
                const ext = EditorUtils.path.extname(file).toLowerCase();
                return extensions.includes(ext);
            });

            success(filteredFiles);
        });
    }

    static createDir(directoryName)  {
        FileManager.fs.mkdir(directoryName, (err) => {
            if (err) {
              console.error('Erreur lors de la création du répertoire :', err);
              throw err;
            } else {
              console.log('Répertoire créé avec succès !');
            }
          });
    }

    // public static getInstance() {

    //     if (!FileManager._instance) {
    //         this._instance = new FileManager();
    //         return FileManager._instance;
    //     } else {
    //         return FileManager._instance;
    //     }
    // }
}