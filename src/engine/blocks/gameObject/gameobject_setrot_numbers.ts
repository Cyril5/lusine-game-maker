import Blockly from 'blockly';
import BlocklyJS from 'blockly/javascript';
import { Mathf } from '../../math/mathf';

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


    BlocklyJS[name] = function (block : any) {

      var value_obj = BlocklyJS.valueToCode(block, 'OBJ', BlocklyJS.ORDER_ATOMIC);

      var value_degx = BlocklyJS.valueToCode(block, 'DEGX', BlocklyJS.ORDER_ATOMIC);

      var value_degy = BlocklyJS.valueToCode(block, 'DEGY', BlocklyJS.ORDER_ATOMIC);
      var value_degz = BlocklyJS.valueToCode(block, 'DEGZ', BlocklyJS.ORDER_ATOMIC);
      var dropdown_space = block.getFieldValue('SPACE');
      // TODO: Assemble JavaScript into code variable.

      //const euler = new THREE.Euler(Mathf.degToRad(value_degx),Mathf.degToRad(value_degy),Mathf.degToRad(value_degz));

      const eulerX = Mathf.getVarClassName()+'.degToRad(' +value_degx+ ')';
      const eulerY = Mathf.getVarClassName()+'.degToRad('+value_degy+')';
      const eulerZ = Mathf.getVarClassName()+'.degToRad('+value_degz+')';

      var code = value_obj+'.transform.rotation.set('+eulerX+','+eulerY+','+eulerZ+');\n';
      return code;
    };
  }
}


