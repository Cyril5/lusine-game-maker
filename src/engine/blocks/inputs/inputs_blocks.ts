import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';

class InputsBlocks {
    constructor() {

        Blockly.Blocks['inputs_onkeydown'] = {
            init: function () {
                this.appendValueInput("KEYCODE")
                    .setCheck("KeyCode")
                    .appendField("Lorsqu'on appuie sur la touche");
                this.appendStatementInput("ONKEYDOWN")
                    .setCheck(null);
                this.setStyle('fsm-event-block');
                this.setColour(20);
                this.setTooltip("Evenement touche Clavier");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['keycode_z'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche Z");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['keycode_d'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche D");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };


        Blockly.Blocks['keycode_s'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche S");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['keycode_q'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche Q");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };


        Blockly.Blocks['keycode_uparrow'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche flèche du haut");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };


        Blockly.Blocks['keycode_rightarrow'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche flèche de droite");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['keycode_downarrow'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche flèche du bas");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['keycode_leftnarrow'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche flèche de gauche");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['inputs_onkey'] = {
            init: function () {
                this.appendValueInput("KEYCODE")
                    .setCheck("KeyCode")
                    .appendField("Lorsqu'on reste appuyé sur la touche");
                this.appendStatementInput("ONKEY")
                    .setCheck(null);
                this.setColour(20);
                this.setTooltip("Evenement tant que la touche est enfoncé");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['keycode_space'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("Touche Espace");
                this.setOutput(true, "KeyCode");
                this.setColour(210);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['inputs_if_keydown'] = {
            init: function() {
              this.appendValueInput("KEYCODE")
                  .setCheck("KeyCode")
                  .appendField("La touche");
              this.appendDummyInput()
                  .appendField("est préssée ?");
              this.setOutput(true, "Boolean");
              this.setColour(260);
           this.setTooltip("Retourne vrai si la touche est appuyé");
           this.setHelpUrl("");
            }
          };
          
          Blockly.Blocks['inputs_if_key'] = {
            init: function() {
              this.appendValueInput("KEYCODE")
                  .setCheck("KeyCode")
                  .appendField("La touche");
              this.appendDummyInput()
                  .appendField("est enfoncée ?");
              this.setOutput(true, "Boolean");
              this.setColour(260);
           this.setTooltip("Retourne vrai si la touche est toujours préssé");
           this.setHelpUrl("");
            }
          };


          BlocklyJS['inputs_onkeydown'] = function (block : any) {

            var value_keycode = BlocklyJS.valueToCode(block, 'KEYCODE', BlocklyJS.ORDER_ATOMIC);
            var statements_onkeydown = BlocklyJS.statementToCode(block, 'ONKEYDOWN');
            // TODO: Assemble JavaScript into code variable.
            var code = '...;\n';
            return code;
        };


        BlocklyJS['keycode_z'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
        };


        BlocklyJS['keycode_d'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
        };


        BlocklyJS['keycode_s'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
        };


        BlocklyJS['keycode_q'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, BlocklyJS.ORDER_NONE];
        };


        BlocklyJS['keycode_uparrow'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.
            // @ts-ignore
            return [code, BlocklyJS.ORDER_NONE];
        };

        // @ts-ignore
        BlocklyJS['keycode_rightarrow'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.
            // @ts-ignore
            return [code, BlocklyJS.ORDER_NONE];
        };

        // @ts-ignore
        BlocklyJS['keycode_downarrow'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.
            // @ts-ignore
            return [code, BlocklyJS.ORDER_NONE];
        };

        // @ts-ignore
        BlocklyJS['keycode_leftnarrow'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.
            // @ts-ignore
            return [code, BlocklyJS.ORDER_NONE];
        };

        // @ts-ignore
        BlocklyJS['inputs_onkey'] = function (block : any) {
            // @ts-ignore
            var value_keycode = BlocklyJS.valueToCode(block, 'KEYCODE', BlocklyJS.ORDER_ATOMIC);
            // @ts-ignore
            var statements_onkey = BlocklyJS.statementToCode(block, 'ONKEY');
            // TODO: Assemble JavaScript into code variable.
            var code = '...;\n';
            return code;
        };

        // @ts-ignore
        BlocklyJS['keycode_space'] = function (block : any) {
            // TODO: Assemble JavaScript into code variable.
            var code = '32';
            // TODO: Change ORDER_NONE to the correct strength.
            // @ts-ignore
            return [code, BlocklyJS.ORDER_NONE];
        };

        // @ts-ignore
        BlocklyJS['inputs_if_keydown'] = function (block : any) {
            // @ts-ignore
            var value_keycode = BlocklyJS.valueToCode(block, 'KEYCODE', BlocklyJS.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            var code = 'InputManager.getKeyDown('+value_keycode+')';
            // @ts-ignore
            return [code, BlocklyJS.ORDER_NONE];
        };

        // @ts-ignore
        BlocklyJS['inputs_if_key'] = function (block : any) {
            // @ts-ignore
            var value_keycode = BlocklyJS.valueToCode(block, 'KEYCODE', BlocklyJS.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            var code = '...;\n';
            return code;
        };
    }
}
export { InputsBlocks }
