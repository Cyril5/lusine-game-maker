export interface GameObjectComponentMetaData {
    type:string;
    enabled: boolean;
    data: any;
}

export interface ColliderMetaData extends GameObjectComponentMetaData {
    isTrigger: boolean;
    physicsBody: {
        material: {}
    }
}

export interface FSMMetaData extends GameObjectComponentMetaData {

}

export interface FSMStateMetaData extends GameObjectComponentMetaData {
}