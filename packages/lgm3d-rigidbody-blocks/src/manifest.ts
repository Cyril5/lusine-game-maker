import { BlocksManifest } from "../../lgm3d-core-blocks/dist/manifest";

export const RigidbodyManifest: BlocksManifest = {
  namespace: "lgm.rigidbody",
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