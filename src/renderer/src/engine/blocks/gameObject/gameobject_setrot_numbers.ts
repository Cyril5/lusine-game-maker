import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';

export class GameObjectSetRotationNumbersBlock {

  // const blockName = this.blockName;
  // const code = this.code;

  constructor() {
    const name = 'gameobject_setrotation_numbers';

    Blockly.Blocks[name] = {
      init: function() {
        this.appendValueInput("OBJ")
            .setCheck("GameObject")
            .appendField("Fixer la rotation de");
        this.appendValueInput("DEGX")
            .setCheck("Number")
            .appendField("x");
        this.appendValueInput("DEGY")
            .setCheck("Number")
            .appendField("y");
        this.appendValueInput("DEGZ")
            .setCheck("Number")
            .appendField("z");
        this.appendDummyInput()
            .appendField("dans l'espace")
            .appendField(new Blockly.FieldDropdown([["Local","LOCAL"], ["",""]]), "SPACE");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
     this.setTooltip("Fixer la rotation en degrés de l'objet");
     this.setHelpUrl("");
      }
    };


    BlocklyJS.javascriptGenerator.forBlock['gameobject_setrotation_numbers'] = function(block, generator) {
      const value_obj = generator.valueToCode(block, 'OBJ', generator.ORDER_ATOMIC);
      const value_degx = generator.valueToCode(block, 'DEGX', generator.ORDER_ATOMIC);
      const value_degy = generator.valueToCode(block, 'DEGY', generator.ORDER_ATOMIC);
      const value_degz = generator.valueToCode(block, 'DEGZ', generator.ORDER_ATOMIC);
      const dropdown_space = block.getFieldValue('SPACE');
      
      const code = value_obj+'.setEulerRotation('+value_degx+','+value_degy+','+value_degz+');\n';
      return code;
    };
  }
}


