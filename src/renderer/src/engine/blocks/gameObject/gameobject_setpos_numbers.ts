import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';

export class GameObjectSetPosNumbersBlock {

  // const blockName = this.blockName;
  // const code = this.code;

  constructor() {
    const name = 'gameobject_setpos_numbers';

    Blockly.Blocks[name] = {
      init: function () {
        this.appendValueInput("OBJ")
          .setCheck("GameObject")
          .appendField("Fixer la position de");
        this.appendValueInput("POSX")
          .setCheck("Number")
          .appendField("à")
          .appendField("x");
        this.appendValueInput("POSY")
          .setCheck("Number")
          .appendField("y");
        this.appendValueInput("POSZ")
          .setCheck("Number")
          .appendField("z");
        this.appendDummyInput()
          .appendField("dans l'espace")

          .appendField(new Blockly.FieldDropdown([["Local", "LOCAL"], ["", ""]]), "SPACE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Fixer la position de l'objet dans l'espace local");
        this.setHelpUrl("");
      }
    };


    BlocklyJS[name] = function (block : any) {

      var value_obj = Blockly.JavaScript.valueToCode(block, 'OBJ', Blockly.JavaScript.ORDER_ATOMIC);

      var value_posx = Blockly.JavaScript.valueToCode(block, 'POSX', Blockly.JavaScript.ORDER_ATOMIC);

      var value_posy = Blockly.JavaScript.valueToCode(block, 'POSY', Blockly.JavaScript.ORDER_ATOMIC);

      var value_posz = Blockly.JavaScript.valueToCode(block, 'POSZ', Blockly.JavaScript.ORDER_ATOMIC);
      var dropdown_space = block.getFieldValue('SPACE');
      // TODO: Assemble JavaScript into code variable.

      var code = value_obj + '.transform.position.set(' + value_posx + ',' + value_posy + ',' + value_posz + ');\n';
      return code;
    };



  }
}



