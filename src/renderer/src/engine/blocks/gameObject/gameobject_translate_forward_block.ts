import { LusineBlock } from "../lusineBlock.js.js";
import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';


export class GameObjectTranslateForwardBlock {

    // const blockName = this.blockName;
    // const code = this.code;

    constructor() {
        const name = 'gameobject_translate_forward';

        Blockly.Blocks[name] = {
          init: function() {
            this.appendValueInput("OBJ")
                .setCheck("GameObject")
                .appendField("Déplacer l'objet");
            this.appendValueInput("DISTZ")
                .setCheck(null)
                .appendField("vers l'avant de");
            this.appendDummyInput()
                .appendField("m");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(260);
         this.setTooltip("Déplace l'objet sur l'axe Z dans l'espace local");
         this.setHelpUrl("");
          }
        };
        
 
        BlocklyJS[name] = function(block: any) {

          var value_obj = BlocklyJS.valueToCode(block, 'OBJ', BlocklyJS.ORDER_ATOMIC);
          var value_distz = BlocklyJS.valueToCode(block, 'DISTZ', BlocklyJS.ORDER_ATOMIC);
          // TODO: Assemble JavaScript into code variable.
          var code = value_obj+".translate(BABYLON.Axis.Z,"+value_distz+",BABYLON.Space.LOCAL);\n";
          //car.translate(BABYLON.Axis.Z, 0.5, BABYLON.Space.LOCAL);
          return code;
        };
    }
}


