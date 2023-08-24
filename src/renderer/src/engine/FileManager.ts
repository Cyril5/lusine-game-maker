// import fs from 'fs';
export default class FileManager {

    private static fs = require('fs');
    
    private constructor() {
        
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