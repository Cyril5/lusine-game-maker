import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { Mathf } from '../../math/mathf';

export class GameObjectRotateYBlock {

    // const blockName = this.blockName;
    // const code = this.code;

    constructor() {

      javascriptGenerator.forBlock['gameobject_rotatey'] = (block : any)=> {

          const value_obj = javascriptGenerator.valueToCode(block, 'OBJ', javascriptGenerator.ORDER_ATOMIC);
          const value_degy = javascriptGenerator.valueToCode(block, 'DEGY', javascriptGenerator.ORDER_ATOMIC);
          const dropdown_space = block.getFieldValue('SPACE');
          // TODO: Assemble JavaScript into code variable.
          return `${value_obj}.rotate(BABYLON.Axis.Y, ${BABYLON.Tools.ToRadians(value_degy)}, BABYLON.Space.${dropdown_space});\n`
        };

        Blockly.Blocks['gameobject_rotatey'] = {
          init: function() {
            this.appendValueInput("OBJ")
                .setCheck("GameObject")
                .appendField("Pivoter l'objet");
            this.appendValueInput("DEGY")
                .setCheck("Number")
                .appendField("sur l'axe Y de");
            this.appendDummyInput()
                .appendField("degrés")
                .appendField("dans l'espace :")
                .appendField(new Blockly.FieldDropdown([["Local","LOCAL"], ["Monde","WORLD"]]), "SPACE");
            // this.appendDummyInput()
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(260);
         this.setTooltip("Pivote l'objet sur l'axe Y");
         this.setHelpUrl("");
          }
        };
        


    }
}


