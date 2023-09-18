import Blockly from 'blockly';

export class InputsBlocks {
    constructor() {

        Blockly.Blocks['keycode'] = {
            init: function() {
              this.appendDummyInput()
                  .appendField("Touche")
                  .appendField(new Blockly.FieldDropdown([["D","D"],["Espace","SPACE"], ["Q","Q"], ["S","S"], ["Z","Z"]]), "KEYCODES");
              this.setOutput(true, "KeyCode");
              this.setColour(210);
           this.setTooltip("");
           this.setHelpUrl("");
            }
          };

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
            init: function () {
                this.appendValueInput("KEYCODE")
                    .setCheck("KeyCode")
                    .appendField("La touche");
                this.appendDummyInput()
                    .appendField("est enfoncée ?");
                this.setOutput(true, "Boolean");
                this.setColour(260);
                this.setTooltip("Retourne vrai si la touche est toujours appuyée.");
                this.setHelpUrl("");
            }
        };





    }
}