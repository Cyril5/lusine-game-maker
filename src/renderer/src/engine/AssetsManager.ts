export default class AssetsManager {

    public static textures : Map<string,BABYLON.Texture> = new Map<string,BABYLON.Texture>();
    static _materials : Map<string,BABYLON.Material> = new Map<string,BABYLON.Material>();

    static addMaterial(material: BABYLON.Material) {
        if(!this._materials.has(material.name)){
            this._materials.set(material.name,material);
        }else{
            console.warn(`${material.name} existe déjà dans le projet et la copie à été supprimé`);
            material.dispose();
        }
    }

}