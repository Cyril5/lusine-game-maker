import { ipcMain } from 'electron';
import { NodeIO } from '@gltf-transform/core';
import * as fs from 'fs';
import * as path from 'path';

export function registerGlbIpcHandlers() {

    ipcMain.handle('glb:extract-image', async (_evt, glbPath: string, index: number, outDir: string) => {
        const io = new NodeIO();
        const doc = await io.read(glbPath);

        const textures = doc.getRoot().listTextures();
        const tex = textures[index];
        if (!tex) throw new Error(`Texture index ${index} introuvable`);

        const data = tex.getImage();                      // Uint8Array (octets d’origine)
        const mime = tex.getMimeType() || 'application/octet-stream';
        const ext = (mime.split('/')[1] || 'bin').toLowerCase();

        fs.mkdirSync(outDir, { recursive: true });
        const name = (tex.getName() || `texture${index}`) + '.' + ext;
        const outPath = path.join(outDir, name);
        fs.writeFileSync(outPath, Buffer.from(data));
        return outPath;                                   // chemin absolu
    });

    ipcMain.handle('glb:extract-all-textures', async (_evt, glbPath: string, outDir: string) => {
        const io = new NodeIO();
        const doc = await io.read(glbPath);

        const textures = doc.getRoot().listTextures();
        fs.mkdirSync(outDir, { recursive: true });

        const outPaths: string[] = [];
        textures.forEach((tex, i) => {
            const data = tex.getImage();
            const mime = tex.getMimeType() || 'application/octet-stream';
            const ext = (mime.split('/')[1] || 'bin').toLowerCase();
            const name = (tex.getName() || `texture${i}`) + '.' + ext;
            const p = path.join(outDir, name);
            fs.writeFileSync(p, Buffer.from(data));
            outPaths.push(p);
        });

        return outPaths; // liste des chemins absolus
    });
}

