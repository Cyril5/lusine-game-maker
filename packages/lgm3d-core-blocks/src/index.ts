import Blockly from "blockly";
import "blockly/javascript";            // important
import blocksJson from "./blocks.json";

export { LGM3DCoreManifest } from "./manifest";

export function registerCoreBlocks() {
  Blockly.common.defineBlocksWithJsonArray(blocksJson as any);
  //registerGenerators();
}

