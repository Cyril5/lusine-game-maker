import FileManager from "@renderer/engine/FileManager";
import EditorUtils from "./EditorUtils"
import StateEditorUtils from "./StateEditorUtils";
import LGM3DEditor from "./LGM3DEditor";

export default class ProjectManager {

    private static _projectName: string | null = null;
    private static _currentProjectDir = null;

    // Créer un nom de chemin complet depuis le répertoire du projet
    public static getFilePath(directory: string, file?: string): string {
        const projDir = ProjectManager._currentProjectDir;
        const path = EditorUtils.path.resolve(projDir, directory);
        return EditorUtils.path.resolve(path, file);
    }

    // TODO : remplacer par un getter
    static getModelsDirectory(): string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir, 'Models');
    }

    static getTexturesDirectory():string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir,'Textures');
    }

    // TODO : remplacer par un getter
    static getStateFilesDirectory(): string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir, 'States');
    }

    static openDemoProject() {
        ProjectManager._projectName = "Demo";
        ProjectManager._currentProjectDir = EditorUtils.path.resolve(EditorUtils.path.resolve(EditorUtils.appPath, 'projects'), 'Demo');
        StateEditorUtils.loadStateFilesList();
        LGM3DEditor.getInstance().setupBaseScene();
    }


    static openProject() {

        const editor = LGM3DEditor.getInstance();

        EditorUtils.openDirectoryDialog().then((result) => {
            const selectedDir = result.filePaths[0];
            console.log(result);
            if (selectedDir) {
                ProjectManager._currentProjectDir = selectedDir;
                ProjectManager._projectName = "Mon Projet";
                LGM3DEditor.showAlert(ProjectManager._currentProjectDir);
                StateEditorUtils.loadStateFilesList();
                
                const projectFile = ProjectManager.getFilePath(ProjectManager._currentProjectDir,'game.lgm');

                if(FileManager.fileExists(projectFile)) {
                    editor.load();
                }else{
                    FileManager.writeInFile(projectFile,'',()=>{
                        editor.load();
                    });
                }

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
                        FileManager.writeInFile(ProjectManager.getFilePath(ProjectManager._currentProjectDir,'game.lgm'),'');
                        //Charger le projet
                        StateEditorUtils.loadStateFilesList();
                        LGM3DEditor.getInstance().setupBaseScene();
                        EditorUtils.showInfoMsg(`Projet : ${ProjectManager._projectName} crée !`);
                        LGM3DEditor.getInstance().showStartupModal(true);

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