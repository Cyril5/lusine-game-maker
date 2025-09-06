import EditorUtils from "@renderer/editor/EditorUtils";

// import fs from 'fs';
export default abstract class FileManager {

    static _fs = require('fs');
    static path = require('path');

    private constructor() {

    }

    static fileIsEmpty(filename: string, afterCheckCallback): void {
        FileManager._fs.stat(filename, (err, stats) => {
            if (err) {
                console.error(err);
                return true;
            }
            // Vérifiez si la taille du fichier est égale à 0 pour déterminer s'il est vide
            console.log(stats.size);

            afterCheckCallback(stats.size === 0);

        });
    }

    static fileExists(filename: string): boolean {
        return FileManager._fs.existsSync(filename);
    }

    static writeInFile(filename: string, content: string, onSuccess?: () => void) {
        FileManager._fs.writeFile(filename, content, { flag: 'w+' }, err => {
            if (err) {
                console.error(err);
                throw new Error(err.message);
            }
            if (onSuccess) {
                onSuccess();
            }
        });
    }

    static readTextFile(filename: string | undefined, onSuccess: (data: any) => void) {
        FileManager._fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                throw err;
            }
            onSuccess(data);
        });
    }

    static readFile(filename: string | undefined, onSuccess: (data: any) => void) {
        FileManager._fs.readFile(filename, (err, data) => {
            if (err) {
                console.error(err);
                throw err;
            }
            onSuccess(data);
        });
    }

    static deleteFile(filename: string | null, onSuccess?: () => void) {
        FileManager._fs.unlink(filename, function (err) {
            if (err) {
                console.error("Erreur lors de la suppression du fichier :", err);
                throw err;
            } else {
                if (onSuccess)
                    onSuccess();
            }
        });
    }

    static getDirectoryFiles = (directory, extensions: string[], success): Array<string> => {
        return FileManager._fs.readdir(directory, (err, files) => {
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

    static createDir(directoryName) {
        FileManager._fs.mkdir(directoryName, (err) => {
            if (err) {
                console.error('Erreur lors de la création du répertoire :', err);
                throw err;
            } else {
                console.log('Répertoire créé avec succès !');
            }
        });
    }

    static copyFileToDir(srcPath: string, destDir: string, onSuccess?: (destPath: string) => void) {
        const path = require("path");
        // Conserve le nom du fichier source
        const fileName = path.basename(srcPath);
        const destPath = path.join(destDir, fileName);

        FileManager._fs.copyFile(srcPath, destPath, (err) => {
            if (err) {
                console.error("Erreur lors de la copie du fichier :", err);
                throw err;
            } else {
                console.log(`Fichier copié vers ${destPath}`);
                if (onSuccess) onSuccess(destPath);
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