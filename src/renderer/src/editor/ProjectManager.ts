import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils"
import Editor from "@renderer/components/Editor";
import StateEditorUtils from "./StateEditorUtils";

export default class ProjectManager {


    // Au début les projets Lusine Game Maker était dans le dossier "Mes documents/Lusine Game Maker/Nom du projet"

    private static _projectName: string | null = null;
    private static _currentProjectDir = null;

    // Créer un nom de chemin complet depuis le répertoire du projet
    public static getFilePath(directory: string, file?: string): string {
        // const os = require('os');
        // const path = require('path');
        //const documentsPath = Game.os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        //const dir = Game.path.resolve(documentsPath, directory);
        const projDir = ProjectManager._currentProjectDir;
        const path = EditorUtils.path.resolve(projDir, directory);
        return EditorUtils.path.resolve(path, file);
    }

    // TODO : remplacer par un getter
    static getModelsDirectory(): string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir, 'Models');
    }

    // TODO : remplacer par un getter
    static getStateFilesDirectory(): string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir, 'States');
    }

    static openDemoProject() {
        ProjectManager._projectName = "Demo";
        ProjectManager._currentProjectDir = EditorUtils.path.resolve(EditorUtils.path.resolve(EditorUtils.appPath, 'projects'), 'Demo');
        StateEditorUtils.loadStateFilesList();
        Editor.getInstance().setupBaseScene();
    }


    static openProject() {
        EditorUtils.openDirectoryDialog().then((result) => {
            const selectedDir = result.filePaths[0];
            if (selectedDir) {
                ProjectManager._currentProjectDir = selectedDir;
                ProjectManager._projectName = "Mon Projet";
                Editor.showAlert(ProjectManager._currentProjectDir);
                StateEditorUtils.loadStateFilesList();
                Editor.getInstance().load();
                

            }
        });


    }



    static selectProjectDir() {

    }

    static createProject(): boolean {

        // Prompt du nom du projet
        EditorUtils.openInputDialog({
            title: "Créer un nouveau projet",
            message: 'Entrez le nom de votre projet',
            label: 'Nom:',
            value: 'Mon Projet',
            inputAttrs: { type: 'text', required: true },
            type: 'input',
        }, (projNameResponse) => {

            if (projNameResponse) {
                // ouvrir un OpenDirectoryDialog
                EditorUtils.openDirectoryDialog().then((result) => {

                    if (!result.filePaths[0])
                        return false;

                    ProjectManager._projectName = projNameResponse;

                    //Créer un sous répertoire pour le projet ?
                    const subDirConfirmOptions = {
                        type: 'question',
                        title: `Sous dossier ?`,
                        message: `Voulez-vous créer un sous dossier pour le projet ?`,
                        buttons: ['Oui', 'Non', 'Annuler'],
                        defaultId: 0,
                        cancelId: 2,
                    };
                    const createSubDirConfirm: number = EditorUtils.showMsgDialog(subDirConfirmOptions);
                    switch (createSubDirConfirm) {
                        case 0: //yes
                            //Créer un sous dossier ?
                            try {
                                ProjectManager._currentProjectDir = EditorUtils.path.resolve(result.filePaths[0], ProjectManager._projectName);
                                FileManager.createDir(ProjectManager._currentProjectDir);
                            } catch (error: any) {
                                EditorUtils.showErrorMsg(error.message, "Error");
                                return false;
                            }
                            break;
                        case 1:
                            ProjectManager._currentProjectDir = result.filePaths[0];
                            break;
                        case 2: //annuler
                            return false;
                            break;
                    }

                    //Création des dossiers du projets
                    try {
                        FileManager.createDir(ProjectManager.getFilePath(ProjectManager._currentProjectDir, 'States'));
                        FileManager.createDir(ProjectManager.getFilePath(ProjectManager._currentProjectDir, 'Models'));
                        //Charger le projet
                        StateEditorUtils.loadStateFilesList();
                        Editor.getInstance().setupBaseScene();
                        EditorUtils.showInfoMsg(`Projet : ${ProjectManager._projectName} crée !`);
                        Editor.getInstance().showStartupModal(true);

                    } catch (error: any) {
                        EditorUtils.showErrorMsg(error.message, "Error");
                        return false;
                    }

                    return true;
                });
            }
        }, (error) => {
            console.error(error);
            return false;
        })




    }
}