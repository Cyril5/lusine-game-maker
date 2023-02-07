import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';

export class Vector3dBlocks {

    constructor() {
        Blockly.Blocks['vector3'] = {
            init: function () {
                this.appendValueInput("X")
                    .setCheck("Number")
                    .appendField("Vecteur 3d")
                    .appendField("x");
                this.appendValueInput("Y")
                    .setCheck("Number")
                    .appendField("y");
                this.appendValueInput("Z")
                    .setCheck("Number")
                    .appendField("z");
                this.setInputsInline(true);
                this.setOutput(true, "Vector3D");
                this.setColour(230);
                this.setTooltip("Retourne un nouveau Vecteur");
                this.setHelpUrl("");
            }
        };


        Blockly.Blocks['vector3_get_x'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("x du Vecteur");
                this.appendValueInput("VECTOR")
                    .setCheck("Vector3D");
                this.setInputsInline(true);
                this.setOutput(true, "Number");
                this.setColour(230);
                this.setTooltip("composante x d'un vecteur");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['vector3_get_y'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("y du Vecteur");
                this.appendValueInput("VECTOR")
                    .setCheck("Vector3D");
                this.setInputsInline(true);
                this.setOutput(true, "Number");
                this.setColour(230);
                this.setTooltip("composante y d'un vecteur");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['vector3_get_z'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("z du Vecteur");
                this.appendValueInput("VECTOR")
                    .setCheck("Vector3D");
                this.setInputsInline(true);
                this.setOutput(true, "Number");
                this.setColour(230);
                this.setTooltip("composante z d'un vecteur");
                this.setHelpUrl("");
            }
        };


        BlocklyJS['vector3'] = function(block : any) {

            var value_x = BlocklyJS.valueToCode(block, 'X', BlocklyJS.ORDER_ATOMIC);

            var value_y = BlocklyJS.valueToCode(block, 'Y', BlocklyJS.ORDER_ATOMIC);

            var value_z = BlocklyJS.valueToCode(block, 'Z', BlocklyJS.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            var code = 'new Vector3D('+value_x+','+value_y+','+value_z+')';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
          };
          

          BlocklyJS['vector3_get_x'] = function(block : any) {

            var value_vector = BlocklyJS.valueToCode(block, 'VECTOR', BlocklyJS.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            var code = value_vector+'.x';
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, BlocklyJS.ORDER_NONE];
          };
          

          BlocklyJS['vector3_get_y'] = function(block : any) {

            var value_vector = BlocklyJS.valueToCode(block, 'VECTOR', BlocklyJS.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            var code = value_vector+'.y';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
          };
          

          BlocklyJS['vector3_get_z'] = function(block : any) {

            var value_vector = BlocklyJS.valueToCode(block, 'VECTOR', BlocklyJS.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            var code = value_vector+'.z';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
          };
    }


}