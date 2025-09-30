
export type BlocksManifest = {
  namespace: string;          // ex: "lgm.rigidbody"
  version: number;            // pour migrer si besoin
  categories: ManifestCategory[];
};

export type ManifestCategory = {
  name: string;
  colour?: number | string;   // 210 ou "#FF00AA"
  custom?: string;            // pour catégories dynamiques (custom callback)
  blocks?: BlockRef[];        // liste des blocks (si pas "custom")
  order?: number;             // tri facultatif entre catégories
  when?: () => boolean;       // filtre runtime (ex: hasRigidbody())
};

export type BlockRef = {
  id: string;                 // ex: "lgm_rb_add_force"
  shadowXml?: string;         // optionnel: shadow value inline
  fields?: Record<string, string | number | boolean>; // champs à préremplir
};


export const LGM3DCoreManifest: BlocksManifest = {
  namespace: "lgm.core",
  version: 1,
  categories: [
    {
      name: "Rigidbody (requiert composant)",
      colour: 210,
      order: 50,
      // plus tard tu pourras mettre: when: () => hasRigidbody()
      blocks: [
        { id: "lgm_rb_add_force" },
        { id: "lgm_rb_set_velocity" },
        { id: "lgm_rb_get_velocity" },
        { id: "lgm_rb_get_speed" },
        { id: "lgm_rb_is_sleeping" },
      ],
    },
  ],
};