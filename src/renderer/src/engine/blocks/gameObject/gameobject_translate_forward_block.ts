import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';


export class GameObjectTranslateForwardBlock {

  // const blockName = this.blockName;
  // const code = this.code;
  
  constructor() {
    const name = 'gameobject_translate_forward';

    javascriptGenerator[name] = function (block) {
      const value_obj = javascriptGenerator.valueToCode(block, 'OBJ', javascriptGenerator.ORDER_ATOMIC);
      const value_distz = javascriptGenerator.valueToCode(block, 'DISTZ', javascriptGenerator.ORDER_ATOMIC);
      // Generate JavaScript code to move the object forward by the specified distance in local space
      return `${value_obj}.translate(BABYLON.Axis.Z, ${value_distz}, BABYLON.Space.LOCAL);`
    };
    
    Blockly.Blocks[name] = {
      init: function () {
        this.appendValueInput("OBJ")
          .setCheck("GameObject")
          .appendField("Déplacer l'objet");
        this.appendValueInput("DISTZ")
          .setCheck(null)
          .appendField("vers l'avant de");
        this.appendDummyInput()
          .appendField("unité(s)");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Déplace l'objet sur l'axe Z dans l'espace local");
        this.setHelpUrl("");
      }
    };

    


    javascriptGenerator['gameobject_this'] = function (block) {
      // TODO: Assemble JavaScript into code variable.
      const code = 'this.gameObject';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, javascriptGenerator.ORDER_NONE];
    };
  }
}


