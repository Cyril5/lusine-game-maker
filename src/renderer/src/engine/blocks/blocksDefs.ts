import Blockly from 'blockly';
import javascriptGenerator from 'blockly/javascript';

// BLOCK DEFS
// Les définitions des codes fonctionne seulement si il sont dans la classe "JSCodeBlocks"

import { InputsBlocks } from "./inputs/inputs_blocks";
import { JSCodeBlocks } from "./JSCodeBlocks";
import { GameObjectRotateYBlock } from "./gameObject/gameobject_rotate_y_block";
import { GameObjectSetPosNumbersBlock } from "./gameObject/gameobject_setpos_numbers";
import { GameObjectSetRotationNumbersBlock } from "./gameObject/gameobject_setrot_numbers";
import { GameObjectTranslateForwardBlock } from "./gameObject/gameobject_translate_forward_block";
import { Vector3dBlocks } from "./vector3d_blocks";

// import { Debug } from '../debug';
new JSCodeBlocks();
const GO_SETPOS_NUMBERS_BLOCK = new GameObjectSetPosNumbersBlock();
const GO_TRANSLATE_FORWARD_BLOCK = new GameObjectTranslateForwardBlock();
const GO_ROTATE_Y_BLOCK = new GameObjectRotateYBlock();
const GO_SETROT_NUMBERS_BLOCK = new GameObjectSetRotationNumbersBlock();
const VECTOR3D_BLOCKS = new Vector3dBlocks();
const INPUTS_BLOCKS = new InputsBlocks();


Blockly.Blocks['gameobject_this'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Mon Objet");
    this.setInputsInline(true);
    this.setOutput(true, "GameObject");
    this.setColour(230);
    this.setTooltip("L'objet attaché au FSM");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['gameobject_get_posy'] = {
  init: function () {
    this.appendValueInput("OBJ")
      .setCheck("GameObject")
      .appendField("Position Y de");
    this.setOutput(true, "Number");
    this.setColour(260);
    this.setTooltip("Récupère la position Y de l'objet");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['debug_console_log'] = {
  init: function () {
    this.appendValueInput("LOG")
      .setCheck(null)
      .appendField("Afficher");
    this.appendDummyInput()
      .appendField("dans la console");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Affiche un message dans la console");
    this.setHelpUrl("");
  }
};

// BLOCK STUBS
// TODO : Fonctionne si on les met dans une classe

javascriptGenerator['state_leave_state_checks'] = function (/** @type {any} */ block: any) {

  var statements__leave_state_checks = javascriptGenerator.statementToCode(block, '_LEAVE_STATE_CHECKS');
  // TODO: Assemble JavaScript into code variable.
  var code = '...;\n';
  return code;
};





javascriptGenerator['compare_distance_objects'] = function (/** @type {any} */ block: any) {

  var value_obja = BlocklyJS.valueToCode(block, 'OBJA', BlocklyJS.ORDER_ATOMIC);

  var value_objb = BlocklyJS.valueToCode(block, 'OBJB', BlocklyJS.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = value_obja.position.distanceTo(value_objb);
  // TODO: Change ORDER_NONE to the correct strength.

  return [code, BlocklyJS.ORDER_NONE];
};

javascriptGenerator['debug_console_write'] = function (/** @type {{ getFieldValue: (arg0: string) => any; }} */ block: { getFieldValue: (arg0: string) => any; }) {

  var value_log = BlocklyJS.valueToCode(block, 'LOG', BlocklyJS.ORDER_ATOMIC);
  var colour_textcolor = block.getFieldValue('TEXTCOLOR');
  // TODO: Assemble JavaScript into code variable.
  var code = Debug.classname + ".writeInConsole(" + value_log + ",'" + colour_textcolor + "');\n";
  return code;
};






Blockly.Blocks['state_leave_state_checks'] = {
  init: function () {
    this.appendStatementInput("_LEAVE_STATE_CHECKS")
      .setCheck(null)
      .appendField("_leaveStateChecks");
    this.setColour(345);
    this.setTooltip("NE PAS SUPPRIMER ! Cette fonction permet de v0érifier toutes les conditions pour sortir ou non de l'état vers une transition. Contient une série de if");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['state_exit'] = {
  init: function () {
    this.appendDummyInput()
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("Sortir vers l'état :");
    this.appendValueInput("STATE")
      .setCheck("STATE");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setColour(345);
    this.setTooltip("NE PAS SUPPRIMER !");
    this.setHelpUrl("");
  }
};



Blockly.Blocks['gameobject_find_by_id'] = {
  init: function () {
    this.appendValueInput("ID")
      .setCheck("Number")
      .appendField("l'objet avec l'ID :");
    this.setInputsInline(true);
    this.setOutput(true, "GameObject");
    this.setColour(230);
    this.setTooltip("Retourne l'objet ayant un ID");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['debug_console_write'] = {
  init: function () {
    this.appendValueInput("LOG")
      .setCheck(null)
      .appendField("Ecrire");
    this.appendDummyInput()
      .appendField("dans la console")
      .appendField("en")
      .appendField(new Blockly.FieldColour("#3366ff"), "TEXTCOLOR");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, "Boolean");
    this.setColour(65);
    this.setTooltip("Ecrire un message dans la console");
    this.setHelpUrl("");
  }
};