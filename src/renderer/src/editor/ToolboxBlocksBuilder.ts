// toolbox-builder.ts
import Blockly from "blockly";
import { BlockRef, BlocksManifest, ManifestCategory } from "packages/lgm3d-rigidbody-blocks/dist/manifest";

/** Transforme un BlockRef en XML <block>…</block> */
function blockRefToXml(b: BlockRef): string {
  let fieldXml = "";
  if (b.fields) {
    fieldXml = Object.entries(b.fields)
      .map(([k, v]) => `<field name="${k}">${String(v)}</field>`)
      .join("");
  }
  // Shadow inline facultatif
  const shadow = b.shadowXml ? `<shadow type="${b.id}">${b.shadowXml}</shadow>` : "";
  return `<block type="${b.id}">${fieldXml}${shadow}</block>`;
}

/** Construit le XML d’une catégorie (statique) */
function categoryToXml(cat: ManifestCategory): string {
  const colourAttr = cat.colour != null ? ` colour="${cat.colour}"` : "";
  if (cat.custom) {
    // Catégorie dynamique (callback enregistré côté workspace)
    return `<category name="${cat.name}" custom="${cat.custom}"${colourAttr}></category>`;
  }
  const blocksXml = (cat.blocks ?? []).map(blockRefToXml).join("\n");
  return `<category name="${cat.name}"${colourAttr}>\n${blocksXml}\n</category>`;
}

/** Construit un <xml> toolbox à partir de plusieurs manifests */
export function buildToolboxXml(manifests: BlocksManifest[], opts?: {
  // Ajoute d’autres catégories avant/après (ex: core/vars)
  prependXml?: string; // XML brut à mettre au début
  appendXml?: string;  // XML brut à mettre à la fin
  // Filtre global (ex: ne garder que certaines namespaces)
  include?: (cat: ManifestCategory, manifest: BlocksManifest) => boolean;
}): string {
  // Aplatir toutes les catégories des manifests, en appliquant `when` si défini
  const cats = manifests.flatMap(m =>
    m.categories
      .filter(c => (c.when ? c.when() : true))
      .filter(c => (opts?.include ? opts.include(c, m) : true))
      .map(c => ({ m, c }))
  );

  // Tri par ordre (order asc) puis par nom
  cats.sort((a, b) => (a.c.order ?? 0) - (b.c.order ?? 0) || a.c.name.localeCompare(b.c.name));

  const body = cats.map(({ c }) => categoryToXml(c)).join("\n");

  return `<xml id="toolbox" style="display:none">
${opts?.prependXml ?? ""}
${body}
${opts?.appendXml ?? ""}
</xml>`;
}

/** Version DOM prête pour updateToolbox */
export function buildToolboxDom(manifests: BlocksManifest[], opts?: Parameters<typeof buildToolboxXml>[1]) {
  const xml = buildToolboxXml(manifests, opts);
  return Blockly.utils.xml.textToDom(xml);
}
