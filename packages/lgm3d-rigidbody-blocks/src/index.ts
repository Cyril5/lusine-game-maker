import Blockly from "blockly";
import "blockly/javascript";            // important
import blocksJson from "./blocks.json";
import { registerGenerators } from "./generators";

export { RigidbodyManifest } from "./manifest";

export function registerRigidbodyBlocks() {
  Blockly.common.defineBlocksWithJsonArray(blocksJson as any);
  registerGenerators();
}

