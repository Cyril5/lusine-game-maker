import ProjectManager from "@renderer/editor/ProjectManager";

export type MaterialMeta = {
  textures?: {
    albedo?: string;
    normal?: string;
    metallicRoughness?: string;
    emissive?: string;
    opacity?: string;
    [k: string]: any;
  };
  [k: string]: any;
};

/** S'assure que mat.metadata existe et possède un objet textures. Retourne la ref metadata. */
export function ensureMaterialTexturesMeta(mat: BABYLON.Material): MaterialMeta {
  const anyMat = mat as BABYLON.Material & { metadata?: MaterialMeta };
  if (!anyMat.metadata) anyMat.metadata = {};
  if (!anyMat.metadata.textures || typeof anyMat.metadata.textures !== "object") {
    anyMat.metadata.textures = {};
  }
  return anyMat.metadata;
}

/** Écrit un chemin de texture dans metadata.textures[slot] (normalisé en project-relative) */
export function setMaterialTexturePath(
  mat: BABYLON.Material,
  slot: keyof NonNullable<MaterialMeta["textures"]>,
  path: string
) {
  const meta = ensureMaterialTexturesMeta(mat);
  meta.textures![slot as string] = toProjectRelative(path.trim());
}

function toProjectRelative(path: string): string {
  const root = (ProjectManager._currentProjectDir || "").replace(/\\/g, "/");
  const p = path.replace(/\\/g, "/");
  if (root && p.startsWith(root + "/")) return p.slice(root.length + 1);
  return p;
}

/** Lit un chemin de texture (project-relative) depuis metadata.textures[slot] */
export function getMaterialTexturePath(mat: BABYLON.Material, slot: keyof NonNullable<MaterialMeta["textures"]>): string | undefined {
  const meta = (mat as any).metadata as MaterialMeta | undefined;
  return meta?.textures?.[slot as string];
}

export function copyTexProps(dst: BABYLON.Texture, src: BABYLON.BaseTexture) {
    const s = src as BABYLON.Texture;
    if (!s) return;
    dst.hasAlpha = (s as any).hasAlpha ?? dst.hasAlpha;
    dst.coordinatesIndex = s.coordinatesIndex;
    dst.coordinatesMode = s.coordinatesMode;
    dst.wrapU = s.wrapU; dst.wrapV = s.wrapV;
    dst.uScale = s.uScale; dst.vScale = s.vScale;
    dst.uOffset = s.uOffset; dst.vOffset = s.vOffset;
    dst.uAng = s.uAng; dst.vAng = s.vAng; dst.wAng = s.wAng;
}

function makeTex(urlRel: string, scene: BABYLON.Scene, isColor: boolean, copyFrom?: BABYLON.BaseTexture | null) {
    const abs = ProjectManager._currentProjectDir + '/' + urlRel.replace(/\\/g, "/");
    const t = new BABYLON.Texture(abs, scene, /*noMipmap*/ false, /*invertY*/ false);

    // gammaSpace correct
    (t as any).gammaSpace = !!isColor;

    // toujours en TRILINEAR comme glTF
    t.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);

    // copie des props éventuelles
    const s = copyFrom as BABYLON.Texture | undefined;
    if (s) {
        t.coordinatesIndex = s.coordinatesIndex;
        t.coordinatesMode = s.coordinatesMode;
        t.wrapU = s.wrapU; t.wrapV = s.wrapV;
        t.uScale = s.uScale; t.vScale = s.vScale;
        t.uOffset = s.uOffset; t.vOffset = s.vOffset;
        t.uAng = s.uAng; t.vAng = s.vAng; t.wAng = s.wAng;
        t.level = s.level;
        t.anisotropicFilteringLevel = s.anisotropicFilteringLevel ?? t.anisotropicFilteringLevel;
    }
    return t;
}

function isTextureUsedSomewhere(scene: BABYLON.Scene, tex: BABYLON.BaseTexture): boolean {
    for (const m of scene.materials) {
        const list = m.getActiveTextures?.() ?? [];
        for (const t of list) if (t === tex) return true;
    }
    return false;
}

function maybeDisposeTexture(scene: BABYLON.Scene, tex?: BABYLON.BaseTexture | null) {
    if (!tex) return;
    const any = tex as any;
    if (tex.isRenderTarget) return;
    if (any.isCube && scene.environmentTexture === tex) return;             // IBL
    if ((scene as any)._environmentBRDFTexture === tex) return;             // LUT BRDF globale
    if (!isTextureUsedSomewhere(scene, tex)) tex.dispose();
}

export function rebindMaterialsFromMetadataAndCleanup(materials: BABYLON.Material[], scene: BABYLON.Scene) {
    const toMaybeDispose = new Set<BABYLON.BaseTexture>();

    for (const mat of materials) {
        // Snapshot des textures AVANT remplacement
        const oldList = mat.getActiveTextures ? mat.getActiveTextures().slice() : [];

        // Rebind depuis metadata
        loadMaterialTexturesFromMetadata(mat, scene);

        // Mémorise les anciennes pour un dispose éventuel
        for (const t of oldList) toMaybeDispose.add(t);
    }

    // Sweep: détruit celles qui ne sont plus utilisées par aucun matériau
    for (const tex of toMaybeDispose) {
        maybeDisposeTexture(scene, tex);
    }
}


export function loadMaterialTexturesFromMetadata(mat: BABYLON.Material, scene: BABYLON.Scene) {
    const meta = (mat.metadata as any)?.textures;
    if (!meta) return;

    const cls = (mat.getClassName?.() || "").toLowerCase();
    if (cls !== "pbrmaterial") return; // (ajoute StandardMaterial si besoin)

    const m = mat as BABYLON.PBRMaterial;

    // Albedo/BaseColor
    if (meta.albedo) {
        m.albedoTexture = makeTex(meta.albedo, scene, /*isColor*/ true, m.albedoTexture);
    }

    // Normal
    if (meta.normal) {
        m.normalTexture = makeTex(meta.normal, scene, /*isColor*/ false, m.normalTexture ?? m.bumpTexture);
        // (par défaut invertY=false ci-dessus; c’est ce qu’attend glTF)
    }

    // Metallic-Roughness (ORM)
    if (meta.metallicRoughness) {
        const orm = makeTex(meta.metallicRoughness, scene, /*isColor*/ false, m.metallicTexture);
        m.metallicTexture = orm;
        m.ambientTexture = orm; // AO (canal R)
        m.useRoughnessFromMetallicTextureGreen = true;
        m.useMetallnessFromMetallicTextureBlue = true;
        m.useAmbientOcclusionFromMetallicTextureRed = true;
        // optionnel :
        // m.ambientTextureStrength = meta.occlusionStrength ?? m.ambientTextureStrength ?? 1;
    }

    // Emissive / Opacity si présents
    if (meta.emissive) m.emissiveTexture = makeTex(meta.emissive, scene, true, m.emissiveTexture);
    if (meta.opacity) m.opacityTexture = makeTex(meta.opacity, scene, false, m.opacityTexture);

    // Bonus : assure un IBL si absent (les PBR en ont besoin pour ne pas paraître ternes)
    if (!scene.environmentTexture) {
        // mets ton .env/.dds ici si tu en as un
        // scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/environment.env", scene);
    }
}

export function assignToMatchingSlot(
    mat: BABYLON.Material,
    oldTex: BABYLON.BaseTexture,
    newTex: BABYLON.Texture
): string | null {
    // Helpers de comparaison (évite les faux négatifs)
    const same = (a?: BABYLON.BaseTexture | null, b?: BABYLON.BaseTexture | null) =>
        !!a && !!b && (a === b || a.uniqueId === b.uniqueId || (getUrl(a) && getUrl(a) === getUrl(b)));

    function getUrl(t: BABYLON.BaseTexture | null | undefined): string | undefined {
        const any = t as any;
        return any?.url ?? any?._texture?.url;
    }

    // 1) MultiMaterial → descendre dans les subMaterials
    if (mat instanceof BABYLON.MultiMaterial) {
        for (const sm of mat.subMaterials ?? []) {
            if (!sm) continue;
            const slot = assignToMatchingSlot(sm, oldTex, newTex);
            if (slot) return slot; // on remonte le premier trouvé
        }
        return null;
    }

    // 2) Identification par className (évite les soucis de "instanceof")
    const klass = (mat.getClassName?.() || "").toLowerCase();

    if (klass === "pbrmaterial") {
        const m = mat as BABYLON.PBRMaterial;

        if (same(m.albedoTexture, oldTex)) { m.albedoTexture = newTex; return "albedo"; }
        // certains exporters utilisent baseTexture pour le baseColor (rare)
        if (same((m as any).baseTexture, oldTex)) { (m as any).baseTexture = newTex; return "albedo"; }

        if (same(m.normalTexture, oldTex)) { m.normalTexture = newTex; return "normal"; }
        if (same(m.bumpTexture, oldTex)) { m.bumpTexture = newTex; return "normal"; }

        if (same(m.metallicTexture, oldTex)) { m.metallicTexture = newTex; return "metallicRoughness"; }
        // si tu gères roughnessTexture séparée :
        if (same((m as any).roughnessTexture, oldTex)) { (m as any).roughnessTexture = newTex; return "roughness"; }

        if (same(m.ambientTexture, oldTex)) { m.ambientTexture = newTex; return "occlusion"; }
        if (same(m.emissiveTexture, oldTex)) { m.emissiveTexture = newTex; return "emissive"; }
        if (same(m.opacityTexture, oldTex)) { m.opacityTexture = newTex; return "opacity"; }
        if (same(m.reflectionTexture, oldTex)) { m.reflectionTexture = newTex; return "reflection"; }
        if (same(m.lightmapTexture, oldTex)) { m.lightmapTexture = newTex; return "lightmap"; }

        // la plupart du temps on n’exporte pas celle-ci :
        if (same((m as any).environmentBRDFTexture, oldTex)) { (m as any).environmentBRDFTexture = newTex; return "envBRDF"; }

        return null;
    }

    if (klass === "standardmaterial") {
        const m = mat as BABYLON.StandardMaterial;

        if (same(m.diffuseTexture, oldTex)) { m.diffuseTexture = newTex; return "diffuse"; }
        if (same(m.specularTexture, oldTex)) { m.specularTexture = newTex; return "specular"; }
        if (same(m.emissiveTexture, oldTex)) { m.emissiveTexture = newTex; return "emissive"; }
        if (same(m.ambientTexture, oldTex)) { m.ambientTexture = newTex; return "ambient"; }
        if (same(m.bumpTexture, oldTex)) { m.bumpTexture = newTex; return "normal"; }
        if (same(m.opacityTexture, oldTex)) { m.opacityTexture = newTex; return "opacity"; }
        if (same(m.reflectionTexture, oldTex)) { m.reflectionTexture = newTex; return "reflection"; }
        if (same(m.refractionTexture, oldTex)) { m.refractionTexture = newTex; return "refraction"; }

        return null;
    }

    // NodeMaterial / autres : à traiter à part (parcours des InputBlock de type texture)
    return null;
}
