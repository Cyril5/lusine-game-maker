export interface GameObjectComponentMetaData {
    type:string;
}

export interface ColliderMetaData extends GameObjectComponentMetaData {
    shape : {};
    isTrigger: boolean;
    physicsBody: {
        material: {}
    }
}

export interface FSMStateMetaData extends GameObjectComponentMetaData {
}