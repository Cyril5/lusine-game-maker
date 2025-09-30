// lgm3D.StateRuntimeManager.ts
import * as esbuild from "esbuild-wasm";
import esbuildWasmUrl from "../../assets/esbuild.wasm?url";

type ESModule = { default: new (api: any) => any };

// Mémo global (survit au HMR de Vite)
const ESBUILD_INIT_KEY = "__LGM3D_ESBUILD_INIT__";
const g = globalThis as any;

// Map des modules déjà chargés
const modules = new Map<string, ESModule>();

async function initOnce(): Promise<void> {
  if (g[ESBUILD_INIT_KEY]) return g[ESBUILD_INIT_KEY];

  g[ESBUILD_INIT_KEY] = esbuild
    .initialize({ wasmURL: esbuildWasmUrl })
    .catch((err) => {
      // Esbuild lève "Cannot call initialize more than once" si déjà init : on ignore
      const msg = String(err?.message || err);
      if (msg.includes("initialize") && msg.includes("more than once")) return;
      throw err;
    });

  return g[ESBUILD_INIT_KEY];
}

export class StateRuntimeManager {
  static async prepare(stateId: string, tsCode: string) {
    if (modules.has(stateId)) return; // déjà compilé/importé

    await initOnce();

    const out = await esbuild.transform(tsCode, {
      loader: "ts",
      format: "esm",
      sourcemap: "inline",
      sourcesContent: true,
      sourcefile: `${stateId}.ts`,
    });

    const url = URL.createObjectURL(
      new Blob([out.code], { type: "application/javascript" })
    );

    // @vite-ignore pour import de Blob URL
    const mod = (await import(/* @vite-ignore */ url)) as ESModule;
    modules.set(stateId, mod);
  }

  static getModule(stateId: string) {
    return modules.get(stateId);
  }
}
