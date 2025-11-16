import { Observable, SceneLoader, Node, TransformNode, Material, Scene, AbstractMesh } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import EditorUtils from "@renderer/editor/EditorUtils";
import AssetsManager from "./lgm3D.AssetsManager";
import FileManager from "./lgm3D.FileManager";
import { NodeIO } from '@gltf-transform/core';
import { assignToMatchingSlot, copyTexProps } from "./utils/MaterialUtils";
import { TransformsAnalyzer } from "./utils/lgm3D.TransformsAnalyzer";

export class Model3D extends GameObject {

    // event lorsqu'on clic sur le model3D

    static materials: Map<string, BABYLON.Material> = new Map<string, BABYLON.Material>();

    onLoaded = new Observable<Model3D>(); // Observable pour l'événement

    static createFromModel(modelsDirectory: string, filename: string, options: null, scene: BABYLON.Scene): Model3D {
        return new Model3D({
            directoryOrUrl: modelsDirectory,
            filename: filename,
            options: options,
            scene: scene
        });
    }

    // Second constructeur
    static createEmptyFromNodeData(node: BABYLON.TransformNode): Model3D {
        const model3d = new Model3D({ scene: node.getScene(), node, options: { autoReuseMaterials: true } });
        return model3d;
    }

    // Utilitaire: récupère tous les matériaux référencés par une liste de meshes (et leurs enfants)
    _getAllMaterialsFromMeshes(meshes: BABYLON.AbstractMesh[]): Set<BABYLON.Material> {
        const set = new Set<BABYLON.Material>();
        const all: BABYLON.AbstractMesh[] = [];

        for (const m of meshes) {
            all.push(m);
            m.getChildMeshes(false).forEach(c => all.push(c));
        }

        for (const m of all) {
            const mat = m.material;
            if (!mat) continue;
            if (mat instanceof BABYLON.MultiMaterial) {
                for (const sm of mat.subMaterials) if (sm) set.add(sm);
            } else {
                set.add(mat);
            }
        }
        return set;
    }

    // Utilitaire: remplace par nom, y compris à l'intérieur des MultiMaterial
    _reassignMaterialByName(
        meshes: BABYLON.AbstractMesh[],
        materialName: string,
        replacement: BABYLON.Material,
        materialsToDispose: Set<BABYLON.Material>
    ) {
        const all: BABYLON.AbstractMesh[] = [];
        for (const m of meshes) {
            all.push(m);
            m.getChildMeshes(false).forEach(c => all.push(c));
        }

        for (const mesh of all) {
            const mat = mesh.material;
            if (!mat) continue;

            if (mat instanceof BABYLON.MultiMaterial) {
                let changed = false;
                const subs = mat.subMaterials.slice();
                for (let i = 0; i < subs.length; i++) {
                    const sm = subs[i];
                    if (sm && sm.name === materialName && sm !== replacement) {
                        materialsToDispose.add(sm);     // l’ancien sub-material sera supprimé après
                        subs[i] = replacement;
                        changed = true;
                    }
                }
                if (changed) {
                    mat.subMaterials = subs;
                }
            } else if (mat.name === materialName && mat !== replacement) {
                materialsToDispose.add(mat);        // l’ancien sera supprimé après
                mesh.material = replacement;        // ✅ le bon assign
            }
        }
    }

    /** ─────────────────────────────────────────────────────────────────────────────
     * Exporte une BaseTexture vers le dossier du modèle et retourne le chemin ABSOLU.
     * - Si la texture vient d’un fichier → copie
     * - Si c’est une vraie data:URI → écrit le fichier (ext sniffée/mime)
     * - Si c’est "C:\...\model.glb#imageN" → extraction via IPC (NodeIO côté main)
     * Retourne null si rien pu faire.
     * ────────────────────────────────────────────────────────────────────────────*/
    private async _exportTextureFile(tex: BABYLON.BaseTexture, modelFilename: string): Promise<string | null> {

        function parseGlbFragment(src?: string): { glbPath: string; index: number } | null {
            if (!src) return null;

            // Cherche "#imageN"
            const m = src.match(/#image(\d+)\b/i);
            if (!m) return null;
            const index = parseInt(m[1], 10);

            // Chemin avant le hash
            let before = src.slice(0, m.index);

            // Certains loaders mettent un "data:" ou "file://"
            if (before.startsWith("data:")) before = before.slice(5);
            if (before.startsWith("file://")) {
                // garde le chemin après file:// (file:///C:/... ou file://C:/...)
                before = before.replace(/^file:\/+/, "");
                // sur Win, ça peut donner "C:/..." : on remplace en backslashes si tu préfères
                before = before.replace(/\//g, require("path").sep);
            }

            // Nettoyage espaces/quotes
            before = before.replace(/^"+|"+$/g, "").trim();

            // Sécurité : s’assurer qu’on a bien un .glb
            const glbMatch = before.match(/(.+\.glb)$/i);
            if (!glbMatch) return null;

            return { glbPath: glbMatch[1], index };
        }

        const path = FileManager.path;

        // 1) Dossier du modèle (e.g. Models/StockKart_PowerMax)
        const baseName = path.parse(modelFilename).name;
        const modelDir = path.join(AssetsManager.getModelsDirectory(), baseName);

        // 2) Récupérer la "source" telle que fournie par Babylon
        const anyTex = tex as any;
        const src: string | undefined = anyTex.url || anyTex._texture?.url || anyTex.name;

        // Helpers locaux
        const isRealDataUri = (s?: string) => !!s && s.startsWith("data:") && s.includes(",");
        const parseDataUriToBuffer = (uri: string): { mime?: string; buffer: Buffer } | null => {
            if (!uri?.startsWith("data:")) return null;
            const sep = uri.indexOf(",");
            if (sep < 0) return null;
            const meta = uri.slice(5, sep);                       // p.ex. "image/png;base64"
            const b64 = uri.slice(sep + 1);
            return { mime: meta.split(";")[0], buffer: Buffer.from(b64, "base64") };
        };
        const sniffImageExt = (buf: Buffer): string => {
            if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "png";
            if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "jpg";
            if (buf.length >= 8 && buf[0] === 0xAB && buf[1] === 0x4B && buf[2] === 0x54 && buf[3] === 0x58 && buf[4] === 0x20 && buf[5] === 0x32 && buf[6] === 0x30 && buf[7] === 0xBB) return "ktx2"; // KTX2
            if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
            if (buf.length >= 12 && buf.toString("ascii", 4, 12) === "ftypavif") return "avif";
            if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "DDS ") return "dds";
            if (buf.length >= 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a")) return "gif";
            if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4D) return "bmp";
            return "bin";
        };

        // 3) Cas 1 : chemin fichier "classique" → on copie
        if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
            try {
                const out = path.join(modelDir, path.basename(src));
                if (!FileManager._fs.existsSync(out)) FileManager._fs.copyFileSync(src, out);
                return out;
            } catch {
                // src peut être une URL non-fichier → on laissera les autres branches gérer
            }
        }

        // 4) Cas 2 : vraie data:URI (avec base64) → on écrit un fichier
        if (isRealDataUri(src)) {
            const parsed = parseDataUriToBuffer(src!);
            if (parsed) {
                const ext = parsed.mime && parsed.mime.startsWith("image/")
                    ? parsed.mime.split("/")[1]
                    : sniffImageExt(parsed.buffer);
                const safeBase = (tex.name || "texture").replace(/[^\w\-]+/g, "_");
                const out = path.join(modelDir, `${safeBase}.${ext}`);
                FileManager._fs.writeFileSync(out, parsed.buffer);
                return out;
            }
        }

        // 5) Cas 3 : "C:\...\model.glb#imageN" → demander au process main d’extraire l’image N
        const frag = parseGlbFragment(src); // détecte glb#imageN
        if (frag) {
            const outAbs: string = await window.electron.ipcRenderer.invoke(
                'glb:extract-image',
                frag.glbPath,
                frag.index,
                modelDir
            );
            return outAbs;
        }

        // 6) Fallback : rien à faire proprement dans ce contexte
        return null;
    }

    private constructor(arg: { scene: Scene, node?: TransformNode, options: { autoReuseMaterials: boolean } });
    private constructor(arg: { directoryOrUrl: string, filename: string, options: { autoReuseMaterials: boolean, extractTextures: true }, scene: BABYLON.Scene });
    private constructor(arg) {

        super("Modèle 3D", arg.scene, arg.node);
        this.type = "Model3D";

        let directoryOrUrl = arg.directoryOrUrl;
        let filename = arg.filename;
        if (arg.node) {
            console.warn(arg.node.metadata);
            filename = arg.node.metadata.sourceFile;
            directoryOrUrl = AssetsManager.getModelsDirectory();
        } else {
            this.metadata["sourceFile"] = arg.filename;
        }

        // Regarder l'extension du modèle
        const extension = filename.split(".")[filename.split(".").length - 1];
        if (extension === "glb" || extension === "gltf") {

            const materialsSceneNames = [];

            // TODO : Recupérer plutôt la liste des Materiaux dans le AssetManager
            arg.scene.materials.forEach((mat) => {
                const last = materialsSceneNames.push(mat.name);
            });

            const mesh = SceneLoader.ImportMesh("", directoryOrUrl + '/', filename, arg.scene, (meshes) => {

                if (meshes[0].name !== "__root__") {
                    console.error("GLB root node not found");
                    return;
                }

                if (!arg.options.autoReuseMaterials) { // si on est pas en import auto                    
                    TransformsAnalyzer.sanitizeImportedNodes(
                        this.scene,
                        meshes,
                        (meshes as any).transformNodes ?? [], // selon ta version, ImportMeshAsync renvoie tns
                        {
                            forceGuidAll: false,   // mets true si tu veux GUID pour tous les TN/meshes
                            guidLength: 10,
                            keepOriginalName: true // conserve les "name" du GLB pour l’UI
                        }
                    );
                }

                const materialsToDispose = new Set<Material>();
                const importedMats = this._getAllMaterialsFromMeshes(meshes);

                importedMats.forEach(async mat => {

                    const pathMod = FileManager.path;
                    const modelBase = pathMod.parse(filename).name;
                    const modelDir = pathMod.join(AssetsManager.getModelsDirectory(), modelBase);

                    // Extraction des texture
                    if (arg.options.extractTextures !== undefined && arg.options.extractTextures) {
                        console.log("Extraction des textures");
                        const textures = mat.getActiveTextures();
                        for (const tex of textures) {
                            // option : ignorer les cube maps / RTT
                            if ((tex as any).isCube || tex.isRenderTarget) continue;

                            const texAbs = await this._exportTextureFile(tex, filename);
                            if (!texAbs) continue;
                            // Normaliser les séparateurs (\ → / sur Windows)
                            const normalized = FileManager.path.normalize(texAbs);
                            // Cherche la sous-chaîne "Models"
                            const idx = normalized.indexOf("Models");
                            let location = normalized;
                            if (idx !== -1) {
                                location = normalized.substring(idx);
                            }

                            console.log(location);

                            // nouvelle Texture depuis le chemin RELATIF (pour rechargement futur)
                            const newTex = new BABYLON.Texture(texAbs, arg.scene, true, false);
                            copyTexProps(newTex, tex);

                            const slot = assignToMatchingSlot(mat, tex, newTex);
                            //if (!slot) continue; // slot non géré (NodeMaterial, etc.)

                            // metadata : on mémorise par slot
                            const meta: any = { ...(mat.metadata || {}) };
                            meta.textures = { ...(meta.textures || {}), [slot]: location };
                            mat.metadata = meta;
                            tex.dispose();
                        }
                    }

                    const originalName = mat.name;
                    if (!materialsSceneNames.includes(originalName)) return;

                    let replaceMat = 1;
                    if (!arg.options.autoReuseMaterials) {
                        replaceMat = EditorUtils.showMsgDialog({
                            message: `Le matériel nommé ${originalName} existe déjà dans le projet. Voulez-vous l'utiliser pour ce modèle ?`,
                            type: 'warning',
                            buttons: ['Ajouter le materiel du modèle au projet', 'Réutiliser celui du projet'],
                            defaultId: 0,
                            title: "Conflits de matériaux",
                        });
                    }
                    if (replaceMat === 1) {
                        const existing = arg.scene.getMaterialByName(originalName);
                        if (existing && existing !== mat) {
                            // (Optionnel) marquer visuellement l’importé pour debug
                            // mat.name = `${originalName}__toRemove`;

                            // Remapper partout où ce nom apparaît (y compris MultiMaterial)
                            console.log("reasign material");
                            this._reassignMaterialByName(meshes, originalName, existing, materialsToDispose);
                        }
                    } else {
                        mat.name = this._getUniqueMaterialName(arg.scene, originalName);
                        AssetsManager.addMaterial(mat);
                    }
                });

                // Après remap, on peut supprimer en sécurité les anciens matériaux
                materialsToDispose.forEach(m => {
                    // Double-check: ne supprimer que s’il n’est plus utilisé
                    const stillUsed = arg.scene.meshes.some(me => {
                        if (me.material === m) return true;
                        if (me.material instanceof BABYLON.MultiMaterial) {
                            return me.material.subMaterials.some(sm => sm === m);
                        }
                        return false;
                    });
                    if (!stillUsed) {
                        m.dispose(true, true);
                    }
                });


                //---------------------------------------------------
                // Fusionner tous les maillages individuels en un seul maillage
                //const mergedMesh = BABYLON.Mesh.MergeMeshes(meshes[0].getChildMeshes(), true, true, undefined, false, true);
                meshes[0].getChildren(undefined, true).forEach((node: Node) => {
                    node.parent = this._transform;
                    if (node instanceof TransformNode) {
                        node.doNotSerialize = true; // ne pas sauvegarder les sous-noeuds du modèle lors du save
                    }
                });

                //enlever le mesh root "__root__"
                meshes[0].dispose();

                //mergedMesh!.setParent(this.transform);
                materialsToDispose.forEach((mat) => {
                    console.log(mat);
                    //arg.scene.getMaterialByUniqueID(mat)!.dispose();
                })
                this.onLoaded.notifyObservers(this);

            }, (onProgress) => {

            }, (scene: Scene, message: string, exception?: any) => {
                console.error(message);
            });
        }



    }

    private _getUniqueMaterialName(scene: Scene, baseName: string): string {
        let name = baseName;
        let i = 1;
        while (scene.getMaterialByName(name)) {
            name = `${baseName}_${i++}`;
        }
        return name;
    }


    deserialize(): void {

    }

}



