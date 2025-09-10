/*
 * lgm3D.TransformsAnalyzer.ts
 * ---------------------------------------------------------------
 * Outils centralisés pour diagnostiquer et corriger les problèmes
 * de transformNodes dans les fichiers .lgm/.babylon de l'éditeur.
 * - Détection des doublons d'ID/Name
 * - Normalisation des types (TransformNode only)
 * - Nettoyage des champs runtime (plugins/physics/stencil)
 * - Mise à jour des parentId après renommage
 * - Auto-fix des incohérences TRS/matrix
 * - Bisection pour isoler les nœuds fautifs
 * - Wrapper de chargement avec retry automatique après fix
 * - Sanitize d'un AssetContainer fraîchement importé
 * ---------------------------------------------------------------
 */

import ShortUniqueId from "short-unique-id";
import type {
  Engine,
  Scene,
  Node,
  TransformNode,
  AssetContainer,
} from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";

// Types utilitaires minimalistes pour l'accès au FS du projet
export interface IFileManager {
  readFile(path: string, cb: (text: string) => void): void;
  writeInFile(path: string, content: string, cb: () => void): void;
}

export type ScanIssue = {
  index: number;
  id: string;
  problems: string[];
};

export type ScanSummary = {
  issues: ScanIssue[];
  issuesCount: number;
  tnsCount: number;
};

export type SanitizeOptions = {
  /** Forcer un GUID court sur *tous* les transformNodes (pas uniquement les doublons). */
  forceGuidAll?: boolean;
  /** Longueur des GUID (short-unique-id). Par défaut 10. */
  guidLength?: number;
  /** Conserver les `name` d'origine pour l'UI et ne changer que `id`. */
  keepOriginalName?: boolean;
};

export class TransformsAnalyzer {
  private static makeUID(length = 10) {
    const uid = new ShortUniqueId({ length });
    return () => uid.rnd();
  }

  // ---------------------------------------------
  // 1) SCAN = détection des problèmes évidents
  // ---------------------------------------------
  static scanTransformNodesRaw(json: any): ScanSummary {
    const issues: ScanIssue[] = [];
    const seen = new Set<string>();
    const tns = Array.isArray(json?.transformNodes) ? json.transformNodes : [];

    const isNum = (x: any) => typeof x === "number" && isFinite(x);
    const isVec3 = (v: any) => Array.isArray(v) && v.length === 3 && v.every(isNum);
    const isQuat = (q: any) => Array.isArray(q) && q.length === 4 && q.every(isNum);

    tns.forEach((n: any, i: number) => {
      const key = (n?.id ?? n?.name) as string | undefined;
      const id = key || `#${i}`;
      const problems: string[] = [];

      if (!key || !key.trim()) problems.push("missing id/name");
      else if (seen.has(key)) problems.push(`duplicate id/name: ${key}`);
      else seen.add(key);

      const ct = n?.customType;
      if (ct && ct !== "BABYLON.TransformNode") problems.push(`customType non-Babylon: ${ct}`);

      if (n?.plugins) problems.push("plugins present");
      if ("physicsImpostor" in (n || {}) || "physics" in (n || {})) problems.push("physics present");
      if ("stencil" in (n || {})) problems.push("stencil present");

      if (n?.position && !isVec3(n.position)) problems.push("position invalide");
      if (n?.scaling && !isVec3(n.scaling)) problems.push("scaling invalide");
      if (n?.rotation && !isVec3(n.rotation)) problems.push("rotation invalide");
      if (n?.rotationQuaternion && !isQuat(n.rotationQuaternion)) problems.push("rotationQuaternion invalide");
      if (n?.rotation && n?.rotationQuaternion) problems.push("rotation & rotationQuaternion présents");

      if (n?._matrix) {
        const m = n._matrix;
        const ok = Array.isArray(m) && m.length === 16 && m.every(isNum);
        if (!ok) problems.push("matrix invalide (16 nombres attendus)");
      }

      if (typeof n?.parentId !== "undefined" && typeof n.parentId !== "string") problems.push("parentId non string");

      if (problems.length) issues.push({ index: i, id, problems });
    });

    if (issues.length) {
      console.groupCollapsed(`[scanTransformNodes] ${issues.length} issue(s)`);
      for (const it of issues) console.warn(`TN[${it.index}] ${it.id} →`, it.problems.join(", "));
      console.groupEnd();
    } else {
      console.log("[scanTransformNodes] no obvious issues.");
    }

    return { issues, issuesCount: issues.length, tnsCount: tns.length };
  }

  // --------------------------------------------------------------------------------
  // 2) SANITIZE = dédoublonner, normaliser, et corriger les parentId qui pointent
  // --------------------------------------------------------------------------------
  static sanitizeTransformNodesAndParents(data: any, options: SanitizeOptions = {}) {
    const tns = Array.isArray(data?.transformNodes) ? data.transformNodes : [];
    if (!tns.length) return { renamed: 0 };

    const mk = this.makeUID(options.guidLength ?? 10);
    const oldToNew = new Map<string, string>();

    // 1) Attribuer des IDs uniques
    const seen = new Map<string, number>();
    for (const n of tns) {
      let id = (n?.id ?? n?.name) as string | undefined;
      if (!id || !id.trim()) id = mk();

      const base = id.trim();
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);

      const needsGuid = options.forceGuidAll || count > 1;
      const newId = needsGuid ? mk() : base;

      if (newId !== id) oldToNew.set(id, newId);
      n.id = newId;

      // Name : on peut conserver le nom d'origine pour l'UI
      if (!options.keepOriginalName) {
        if (!n.name || n.name === id) n.name = n.id;
      }

      // 2) Forcer le type Babylon standard + nettoyer junk runtime
      if (n.customType && n.customType !== "BABYLON.TransformNode") {
        n.metadata = n.metadata || {};
        n.metadata.lgmCustomType = n.customType; // garder l'info pour recréation runtime
      }
      n.customType = "BABYLON.TransformNode";
      delete n.plugins;
      delete n.physicsImpostor;
      delete n.physics;
      delete n.stencil;

      // 3) Auto-fix TRS/matrix (basique, le strict est dans autoFixTN)
      if (n.rotation && n.rotationQuaternion) delete n.rotation; // éviter double rotation
      const isNum = (x: any) => typeof x === "number" && isFinite(x);
      if (n._matrix && (!Array.isArray(n._matrix) || n._matrix.length !== 16 || !n._matrix.every(isNum))) {
        delete n._matrix;
      }
    }

    if (!oldToNew.size) return { renamed: 0 };

    // 4) Mettre à jour toutes les références parentId
    const patchParent = (obj: any) => {
      if (obj && typeof obj.parentId === "string" && oldToNew.has(obj.parentId)) {
        obj.parentId = oldToNew.get(obj.parentId);
      }
    };

    for (const n of tns) patchParent(n);
    for (const m of (Array.isArray(data?.meshes) ? data.meshes : [])) patchParent(m);
    for (const c of (Array.isArray(data?.cameras) ? data.cameras : [])) patchParent(c);
    for (const l of (Array.isArray(data?.lights) ? data.lights : [])) patchParent(l);

    return { renamed: oldToNew.size };
  }

  // ------------------------------------------------------
  // 3) Auto-fix strict (types/valeurs incohérentes)
  // ------------------------------------------------------
  static autoFixTN(json: any) {
    const tns = Array.isArray(json?.transformNodes) ? json.transformNodes : [];
    let fixed = 0;

    const isNum = (x: any) => typeof x === "number" && isFinite(x);
    const isVec3 = (v: any) => Array.isArray(v) && v.length === 3 && v.every(isNum);
    const isQuat = (q: any) => Array.isArray(q) && q.length === 4 && q.every(isNum);

    for (const n of tns) {
      if (n.customType && n.customType !== "BABYLON.TransformNode") {
        n.metadata = n.metadata || {};
        n.metadata.lgmCustomType = n.customType;
      }
      n.customType = "BABYLON.TransformNode";
      if (n.plugins) { delete n.plugins; fixed++; }
      if ("physics" in (n || {})) { delete n.physics; fixed++; }
      if ("physicsImpostor" in (n || {})) { delete n.physicsImpostor; fixed++; }
      if ("stencil" in (n || {})) { delete n.stencil; fixed++; }

      if (n._matrix && (!Array.isArray(n._matrix) || n._matrix.length !== 16 || !n._matrix.every(isNum))) {
        delete n._matrix; fixed++;
      }
      if (n.rotation && n.rotationQuaternion) { delete n.rotation; fixed++; }
      if (n.rotation && !isVec3(n.rotation)) { delete n.rotation; fixed++; }
      if (n.rotationQuaternion && !isQuat(n.rotationQuaternion)) { delete n.rotationQuaternion; fixed++; }
      if (n.position && !isVec3(n.position)) { delete n.position; fixed++; }
      if (n.scaling && !isVec3(n.scaling)) { delete n.scaling; fixed++; }
      if (typeof n.parentId !== "undefined" && typeof n.parentId !== "string") { delete n.parentId; fixed++; }
    }
    return fixed;
  }

  // ---------------------------------------------------------------------------------
  // 4) Bisection: localiser les TN fautifs en chargeant un subset dans une scène test
  // ---------------------------------------------------------------------------------
  static async bisectTNAndReturnOffenders(
    path: string,
    engine: Engine,
    fileMgr: IFileManager,
  ): Promise<number[]> {
    const text = await new Promise<string>((res) => fileMgr.readFile(path, (t) => res(t)));
    const src = JSON.parse(text);
    const arr: any[] = Array.isArray(src?.transformNodes) ? src.transformNodes : [];
    const offenders: number[] = [];

    const tryWith = async (subset: any[]) => {
      const j = JSON.parse(text);
      j.transformNodes = subset;
      const tmp = path.replace(/(\.lgm|\.babylon)$/i, ".tntest.lgm");
      await new Promise<void>((ok) => fileMgr.writeInFile(tmp, JSON.stringify(j), () => ok()));
      const testScene = new (Scene as any)(engine) as Scene;
      try {
        await SceneLoader.AppendAsync("", tmp, testScene, undefined, ".babylon");
        return true;
      } catch {
        return false;
      } finally {
        testScene.dispose();
      }
    };

    let lo = 0, hi = arr.length;
    while (hi - lo > 0) {
      if (hi - lo === 1) {
        const ok = await tryWith([arr[lo]]);
        if (!ok) offenders.push(lo);
        break;
      }
      const mid = lo + Math.floor((hi - lo) / 2);
      const leftOk = await tryWith(arr.slice(lo, mid));
      if (!leftOk) { hi = mid; continue; }
      const rightOk = await tryWith(arr.slice(mid, hi));
      if (!rightOk) { lo = mid; continue; }
      break; // ni gauche ni droite ne casse → pas de fautif dans l'intervalle
    }
    return offenders;
  }

  // ---------------------------------------------------------------------------------
  // 5) Wrapper de chargement avec retry auto-fix des TransformNodes
  // ---------------------------------------------------------------------------------
  static async appendWithTNGuards(
    projectFile: string,
    scene: Scene,
    fileMgr: IFileManager,
    options: SanitizeOptions = {}
  ) {
    const tryLoad = async (path: string) => {
      SceneLoader.loggingLevel = (SceneLoader as any).DETAILED_LOGGING ?? 3;
      await SceneLoader.AppendAsync("", path, scene, undefined, ".babylon", (s, m, e) => console.error("[Loader ERROR]", m, e));
    };

    try {
      await tryLoad(projectFile);
      return { retried: false };
    } catch (e1) {
      console.warn("[LOAD] échec → scan & fix TransformNodes…", e1);

      const text = await new Promise<string>((res) => fileMgr.readFile(projectFile, (t) => res(t)));
      const json = JSON.parse(text);

      // Nettoyages génériques utiles
      json.environmentTexture = null;
      json.physicsEnabled = false; delete json.physicsEngine; delete json.physicsGravity;
      json.postprocesses = []; json.postProcessRenderPipelines = []; json.layers = [];
      if (Array.isArray(json.cameras)) for (const c of json.cameras) c.postProcesses = [];

      // Scan + Sanitize + AutoFix
      const scan = this.scanTransformNodesRaw(json);
      const { renamed } = this.sanitizeTransformNodesAndParents(json, options);
      const fixed = this.autoFixTN(json);

      const tmp = projectFile.replace(/(\.lgm|\.babylon)$/i, ".tnfix.lgm");
      await new Promise<void>((ok) => fileMgr.writeInFile(tmp, JSON.stringify(json), () => ok()));

      try {
        await tryLoad(tmp);
        console.warn(`[LOAD] OK après TN-fix (issues=${scan.issuesCount}, renamed=${renamed}, fixed=${fixed}).`);
        return { retried: true, renamed, fixed, issues: scan.issuesCount, path: tmp };
      } catch (e2) {
        console.warn("[LOAD] encore en échec après TN-fix → bisection TN…", e2);
        const offenders = await this.bisectTNAndReturnOffenders(tmp, scene.getEngine(), fileMgr);
        console.error("[TN offenders] indexes:", offenders);
        if (offenders.length) {
          const srcText = await new Promise<string>((res) => fileMgr.readFile(projectFile, (t) => res(t)));
          const j2 = JSON.parse(srcText);
          j2.transformNodes = (j2.transformNodes || []).filter((_: any, i: number) => !offenders.includes(i));
          const tmp2 = projectFile.replace(/(\.lgm|\.babylon)$/i, ".tnskip.lgm");
          await new Promise<void>((ok) => fileMgr.writeInFile(tmp2, JSON.stringify(j2), () => ok()));
          await tryLoad(tmp2);
          console.warn(`[LOAD] OK en skippant ${offenders.length} transformNode(s) fautif(s).`);
          return { retried: true, skipped: offenders.length, path: tmp2 };
        }
        throw e2;
      }
    }
  }

  // ---------------------------------------------------------------------------------
  // 6) Sanitize d'un AssetContainer au moment d'un import de modèle
  // ---------------------------------------------------------------------------------
  static sanitizeImportedContainer(container: AssetContainer, scene: Scene, options: SanitizeOptions = {}) {
    const mk = this.makeUID(options.guidLength ?? 10);

    // IDs déjà pris dans la scène
    const taken = new Set<string>();
    for (const n of scene.getNodes()) if ((n as any).id) taken.add((n as any).id);

    const makeUnique = (base?: string) => {
      let b = (base && base.trim()) || mk();
      let id = b;
      let i = 2;
      while (taken.has(id)) id = `${b}__${i++}`;
      taken.add(id);
      return id;
    };

    const importedNodes: Node[] = [
      ...container.transformNodes,
      ...container.meshes,
      ...container.cameras,
      ...container.lights,
    ];

    for (const n of importedNodes) {
      const asAny = n as any;

      // ID technique unique (GUID court si forceGuidAll)
      if (options.forceGuidAll || !asAny.id || taken.has(asAny.id)) {
        asAny.id = makeUnique(options.forceGuidAll ? mk() : asAny.id);
      } else {
        taken.add(asAny.id);
      }

      // Nom lisible pour la hiérarchie
      if (!options.keepOriginalName) {
        if (!asAny.name) asAny.name = asAny.id;
      }

      // Standardiser TransformNodes
      if (n instanceof (Object.getPrototypeOf(TransformNode) ? TransformNode : (asAny.constructor))) {
        if (asAny.customType && asAny.customType !== "BABYLON.TransformNode") {
          asAny.metadata = asAny.metadata || {};
          asAny.metadata.lgmCustomType = asAny.customType;
        }
        asAny.customType = "BABYLON.TransformNode";
        delete asAny.plugins; delete asAny.physics; delete asAny.physicsImpostor; delete asAny.stencil;
      }
    }
  }
}
