import ProjectManager from "@renderer/editor/ProjectManager";

export default class AssetsManager {

    public static textures : Map<string,BABYLON.Texture> = new Map<string,BABYLON.Texture>();
    static _materials : Map<Number,BABYLON.Material> = new Map<Number,BABYLON.Material>();
    public static onMaterialsListChanged: BABYLON.Observable<void> = new BABYLON.Observable();

    static addMaterial(material: BABYLON.Material) {
        if(!this._materials.has(material.uniqueId)){
            this._materials.set(material.uniqueId,material);
            AssetsManager.onMaterialsListChanged.notifyObservers();
        }else{
            console.error(`${material.name} existe déjà dans le projet`);
        }
    }

    // TODO : remplacer par un getter
    static getModelsDirectory(): string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir!, 'Models');
    }

    static getTexturesDirectory():string {
        return ProjectManager.getFilePath(ProjectManager._currentProjectDir!,'Textures');
    }

}