import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';
import { Mathf } from '../../math/mathf';

export class GameObjectRotateYBlock {

    // const blockName = this.blockName;
    // const code = this.code;

    constructor() {
        const name = 'gameobject_rotatey';

        Blockly.Blocks[name] = {
          init: function() {
            this.appendValueInput("OBJ")
                .setCheck("GameObject")
                .appendField("Pivoter l'objet");
            this.appendValueInput("DEGY")
                .setCheck(null)
                .appendField("sur l'axe Y de");
            this.appendDummyInput()
                .appendField("degrés");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(260);
         this.setTooltip("Pivote l'objet sur l'axe Y dans l'espace local");
         this.setHelpUrl("");
          }
        };
        

        BlocklyJS[name] = function(block : any) {

          var value_obj = BlocklyJS.valueToCode(block, 'OBJ', BlocklyJS.ORDER_ATOMIC);
          var value_degy = BlocklyJS.valueToCode(block, 'DEGY', BlocklyJS.ORDER_ATOMIC);
          // TODO: Assemble JavaScript into code variable.
          var yrad = Mathf.getVarClassName()+'.degToRad('+value_degy+')';
          var code = value_obj+".transform.rotateY("+yrad+");\n";
          return code;
        };
    }
}


