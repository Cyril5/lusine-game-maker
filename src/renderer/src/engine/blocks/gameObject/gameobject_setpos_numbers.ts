import Blockly from 'blockly';
import javascriptGenerator from 'blockly/javascript';

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






  }
}



