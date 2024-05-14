import Qualifiers from '@renderer/editor/Qualifiers';
import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

export class JSCodeBlocks {

    constructor() {

        Blockly.Blocks['game_ongamestoped'] = {
            init: function () {
                this.appendStatementInput("ONGAMESTOPPED")
                    .setCheck(null)
                    .appendField("A l'arrêt du jeu");
                this.setColour(0);
                this.setTooltip("Evenement qui s'execute après que le jeu s'arrête");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['gameobject_move_forward'] = {
            init: function () {
                this.appendValueInput("OBJ")
                    .setCheck("GameObject")
                    .appendField("Déplacer l'objet");
                this.appendValueInput("SPEED")
                    .setCheck(null)
                    .appendField("vers l'avant à la vitesse de");
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(260);
                this.setTooltip("Déplace l'objet à une vitesse vers l'avant");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['gameobject_turny'] = {
            init: function () {
                this.appendValueInput("OBJ")
                    .setCheck("GameObject")
                    .appendField("Tourner l'objet");
                this.appendValueInput("ROTSPEEDY")
                    .setCheck("Number")
                    .appendField("sur l'axe Y à la vitesse de");
                this.appendDummyInput()
                    .appendField(". Dans l'espace :")
                    .appendField(new Blockly.FieldDropdown([["Local", "LOCAL"], ["Monde", "WORLD"]]), "SPACE");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(260);
                this.setTooltip("Tourne l'objet à une vitesse sur l'axe Y");
                this.setHelpUrl("");
            }
        };


        Blockly.Blocks['inputs_if_keypress'] = {
            init: function () {
                this.appendValueInput("KEYCODE")
                    .setCheck("KeyCode")
                    .appendField("La touche");
                this.appendDummyInput()
                    .appendField("est pressée ?");
                this.setOutput(true, "Boolean");
                this.setColour(260);
                this.setTooltip("Retourne vrai si la touche est pressée");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['inputs_if_keyevent'] = {
            init: function () {
                this.appendValueInput("KEYCODE")
                    .setCheck("KeyCode")
                    .appendField("La touche");
                this.appendDummyInput()
                    .appendField("est")
                    .appendField(new Blockly.FieldDropdown([["pressée", "KeyPressed"], ["enfoncée", "KeyDown"], ["relachée", "KeyUp"]]), "EVENT")
                    .appendField("?");
                this.setOutput(true, "Boolean");
                this.setColour(260);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };


        Blockly.Blocks['qualifier_player'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 16, 16, { alt: "", flipRtl: "FALSE" }))
                    .appendField("Qualifieur : \"Joueur\"");
                this.setOutput(true, "Number");
                this.setColour(20);
                this.setTooltip("Qualifieur \"Joueur\"");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['qualifier_good'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 16, 16, { alt: "", flipRtl: "FALSE" }))
                    .appendField("Qualifieur : \"Bon\"");
                this.setOutput(true, "Number");
                this.setColour(20);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['qualifier_neutral'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 16, 16, { alt: "", flipRtl: "FALSE" }))
                    .appendField("Qualifieur : \"Neutre\"");
                this.setOutput(true, "Number");
                this.setColour(20);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['qualifier_bad'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 16, 16, { alt: "", flipRtl: "FALSE" }))
                    .appendField("Qualifieur : \"Mauvais\"");
                this.setOutput(true, "Number");
                this.setColour(20);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['collision_other_gameobject'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("L'objet touché");
                this.setOutput(true, "GameObject");
                this.setColour(260);
                this.setTooltip("L'objet renvoyé lors d'une collision");
                this.setHelpUrl("");
            }
        };

        javascriptGenerator.forBlock['gameobject_find_by_id'] = function (block: any, generator: any) {

            const value_id = generator.valueToCode(block, 'ID', generator.ORDER_NONE);
            // TODO: Assemble JavaScript into code variable.
            const code = 'GameObject.getById(' + value_id + ')';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, generator.ORDER_NONE];
        };




        javascriptGenerator.forBlock['qualifier_player'] = function (block) {
            // TODO: Assemble javascript into code variable.
            const code = Qualifiers.PLAYER_TAG;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['qualifier_good'] = function (block) {
            const code = Qualifiers.GOOD_TAG;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['qualifier_neutral'] = function (block) {

            const code = Qualifiers.NEUTRAL_TAG;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['qualifier_bad'] = function (block) {
            const code = Qualifiers.BAD_TAG;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['collision_other_gameobject'] = function (block) {
            // TODO: Assemble javascript into code variable.
            const code = 'other.gameObject';
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };
        Blockly.Blocks['gameobject_qualifier'] = {
            init: function () {
                this.appendValueInput("GAMEOBJECT")
                    .setCheck("GameObject");
                this.appendDummyInput()
                    .appendField("est qualifié en tant que");
                this.appendValueInput("QUALIFIER")
                    .setCheck("Number");
                this.setOutput(true, "Boolean");
                this.setColour(260);
                this.setTooltip("Retourne true si l'objet est qualifié de la même valeur indiquée");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['qualifier_enemy'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 16, 16, { alt: "", flipRtl: "FALSE" }))
                    .appendField("Qualifieur : \"Ennemi\"");
                this.setOutput(true, "Number");
                this.setColour(20);
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        javascriptGenerator.forBlock['gameobject_qualifier'] = function (block) {
            const value_gameobject = javascriptGenerator.valueToCode(block, 'GAMEOBJECT', javascriptGenerator.ORDER_ATOMIC);
            const value_qualifier = javascriptGenerator.valueToCode(block, 'QUALIFIER', javascriptGenerator.ORDER_ATOMIC);
            // TODO: Assemble javascript into code variable.
            const code = `${value_gameobject}.qualifier == ${value_qualifier}`;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['qualifier_enemy'] = function (block) {
            // TODO: Assemble javascript into code variable.
            const code = '...';
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_NONE];
        };


        javascriptGenerator.forBlock['debug_console_log'] = function (block) {
            const value_log = javascriptGenerator.valueToCode(block, 'LOG', javascriptGenerator.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code variable.
            const code = 'console.log(' + value_log + ');\n';
            return code;
        };

        Blockly.Blocks['fsm_oncollisionenter'] = {
            init: function () {
                this.appendStatementInput("ONCOLLISIONENTER")
                    .setCheck(null)
                    .appendField("Lorsqu'on entre en collision");
                this.setStyle('fsm_event_blocks');
                this.setColour(120);
                this.setTooltip("");
                this.setHelpUrl("");
            }

        };
        javascriptGenerator.forBlock['fsm_oncollisionenter'] = (block) => {
            const statements_oncollisionenter = javascriptGenerator.statementToCode(block, 'ONCOLLISIONENTER');
            // TODO: Assemble javascript into code variable.
            const code = `this.fsm.onCollisionEnter.add((other) => {\n${statements_oncollisionenter}});\n`;
            return code;
        };

        javascriptGenerator.forBlock['game_ongamestoped'] = function (block, generator) {
            const statements_ongamestopped = generator.statementToCode(block, 'ONGAMESTOPPED');
            // TODO: Assemble javascript into code variable.
            const code = `this.onGameStopped.add(() => {\n${statements_ongamestopped}});\n`;
            return code;
        };

        // ------------------------- GAME OBJECTS ------------------------------

        javascriptGenerator.forBlock['gameobject_this'] = function (block) {
            // TODO: Assemble JavaScript into code variable.
            const code = 'this.gameObject';
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_ATOMIC];
        };

        javascriptGenerator.forBlock['gameobject_get_posy'] = function (block) {
            const value_obj = javascriptGenerator.valueToCode(block, 'OBJ', javascriptGenerator.ORDER_NONE);
            // TODO: Assemble JavaScript into code variable.
            const code = value_obj + '.position.y';
            return [code, javascriptGenerator.ORDER_ATOMIC];
        };


        javascriptGenerator.forBlock['gameobject_setpos_numbers'] = function (block: any) {

            const value_obj = javascriptGenerator.valueToCode(block, 'OBJ', javascriptGenerator.ORDER_ATOMIC);
            const value_posx = javascriptGenerator.valueToCode(block, 'POSX', javascriptGenerator.ORDER_ATOMIC);
            const value_posy = javascriptGenerator.valueToCode(block, 'POSY', javascriptGenerator.ORDER_ATOMIC);
            const value_posz = javascriptGenerator.valueToCode(block, 'POSZ', javascriptGenerator.ORDER_ATOMIC);
            const dropdown_space = block.getFieldValue('SPACE');
            // TODO: Assemble JavaScript into code variable.

            const code = value_obj + '.position = new BABYLON.Vector3(' + value_posx + ',' + value_posy + ',' + value_posz + ');\n';
            return code;
        };

        javascriptGenerator.forBlock['gameobject_move_forward'] = function (block, generator) {
            const value_obj = generator.valueToCode(block, 'OBJ', generator.ORDER_ATOMIC);
            const value_speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC);
            // TODO: Assemble javascript into code variable.
            const code = `${value_obj}.move(BABYLON.Axis.Z,${value_speed} * Game.deltaTime, BABYLON.Space.LOCAL);\n`
            return code;
        };

        javascriptGenerator.forBlock['gameobject_turny'] = function(block, generator) {
            const value_obj = generator.valueToCode(block, 'OBJ', generator.ORDER_ATOMIC);
            const value_rotspeedy = generator.valueToCode(block, 'ROTSPEEDY',generator.ORDER_ATOMIC);
            const dropdown_space = block.getFieldValue('SPACE');
            // TODO: Assemble javascript into code variable.
            const code = `${value_obj}.rotate(BABYLON.Axis.Y, BABYLON.Tools.ToRadians(${value_rotspeedy} * Game.deltaTime), BABYLON.Space.${dropdown_space});\n`;
            //return `${value_obj}.rotate(BABYLON.Axis.Y, BABYLON.Tools.ToRadians(${value_degy}), BABYLON.Space.${dropdown_space});\n`;
            return code;
          };

        //------------------ INPUTS ------------------------------------------------------------------

        javascriptGenerator.forBlock['keycode'] = function (block) {
            const dropdown_keycodes = block.getFieldValue('KEYCODES');
            // TODO: Assemble JavaScript into code variable.
            const code = 'KeyCode.' + dropdown_keycodes;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_ATOMIC];
        };

        javascriptGenerator.forBlock['inputs_if_keyevent'] = function (block, generator) {
            const value_keycode = generator.valueToCode(block, 'KEYCODE', generator.ORDER_ATOMIC);
            const dropdown_event = block.getFieldValue('EVENT');
            // TODO: Assemble javascript into code variable.
            var code = `InputManager.get${dropdown_event}(${value_keycode})`;
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, generator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['inputs_if_keydown'] = (block: any, generator: any) => {

            const value_keycode = generator.valueToCode(block, 'KEYCODE', generator.ORDER_ATOMIC);
            // TODO: Assemble JavaScript into code constiable.
            const code = `InputManager.getKeyDown(${value_keycode})`;
            return [code, generator.ORDER_NONE];
        };

        javascriptGenerator.forBlock['keycode_d'] = function (block: any) {
            // TODO: Assemble JavaScript into code constiable.
            return 'KeyCode.D';
            // TODO: Change ORDER_NONE to the correct strength.
            //return [code,javascriptGenerator.ORDER_ATOMIC];
        };
        javascriptGenerator.forBlock['keycode_space'] = function (block: any) {
            // TODO: Assemble JavaScript into code constiable.
            const code = 'KeyCode.Space';
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, javascriptGenerator.ORDER_ATOMIC];
        };
        javascriptGenerator.forBlock['keycode_z'] = function (block: any) {
            // TODO: Assemble JavaScript into code constiable.
            const code = 'KeyCode.Z';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, javascriptGenerator.ORDER_ATOMIC];
        };

        javascriptGenerator.forBlock['inputs_onkeydown'] = function (block: any) {

            const value_keycode = javascriptGenerator.valueToCode(block, 'KEYCODE', javascriptGenerator.ORDER_ATOMIC);
            const statements_onkeydown = javascriptGenerator.statementToCode(block, 'ONKEYDOWN');
            // TODO: Assemble JavaScript into code constiable.
            const code = '...;\n';
            return code;
        };

        javascriptGenerator.forBlock['keycode_s'] = function (block: any) {
            // TODO: Assemble JavaScript into code constiable.
            const code = 'KeyCode.S';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, javascriptGenerator.ORDER_NONE];
        };


        javascriptGenerator.forBlock['keycode_q'] = function (block: any) {
            // TODO: Assemble JavaScript into code constiable.
            const code = 'KeyCode.Q';
            // TODO: Change ORDER_NONE to the correct strength.

            return [code, javascriptGenerator.ORDER_NONE];
        };


        javascriptGenerator.forBlock['inputs_onkey'] = function (block: any, generator: any) {
            const value_keycode = generator.valueToCode(block, 'KEYCODE', generator.ORDER_ATOMIC);
            const statements_onkey = generator.statementToCode(block, 'ONKEY');
            // TODO: Assemble JavaScript into code constiable.
            const code = '...;\n';
            return code;
        };




        Blockly.Blocks['fsm_init'] = {
            init: function () {
                this.appendStatementInput("INIT")
                    .setCheck(null)
                    .appendField("A L'initialisation");
                this.setTooltip("Appelé avant le start lors de l'initilisation de la FSM");
                this.setHelpUrl("");
                this.setStyle('fsm_event_blocks');
                this.setColour(120);
            }
        };

        Blockly.Blocks['fsm_start'] = {
            init: function () {
                this.appendStatementInput("START")
                    .setCheck(null)
                    .appendField("Lorsque le jeu démarre");
                this.setColour(120);
                this.setTooltip("Start Event");
                this.setHelpUrl("");
                this.setStyle('fsm_event_blocks');
            }
        };

        Blockly.Blocks['fsm_update'] = {
            init: function () {
                this.appendStatementInput("UPDATE")
                    .setCheck(null)
                    .appendField("Toujours");
                this.setColour(120);
                this.setTooltip("Evenement : Boucle de la state machine (Ne boucle plus quand la state machine est  désactivée)");
                this.setHelpUrl("");
                this.setStyle('fsm_event_blocks');
            }
        };




        Blockly.Blocks['state_onenterstate'] = {
            init: function () {
                this.appendStatementInput("ENTERSTATE")
                    .setCheck(null)
                    .appendField("Lorsqu'on rentre dans cet état");
                this.setColour(120);
                this.setTooltip("");
                this.setHelpUrl("");
                this.setStyle('fsm_event_blocks');
            }
        };

        Blockly.Blocks['state_onupdatestate'] = {
            init: function () {
                this.appendStatementInput("UPDATESTATE")
                    .setCheck(null)
                    .appendField("Toujours dans cet état");
                this.setStyle('fsm_event_blocks');
                this.setTooltip("");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['state_onexitstate'] = {
            init: function () {
                this.appendStatementInput("ONEXITSTATE")
                    .setCheck(null)
                    .appendField("Lorqu'on quitte l'état");
                this.setColour(120);
                this.setTooltip("Est appelé au moment l'état de la FSM va changer");
                this.setHelpUrl("");
                this.setStyle('fsm_event_blocks');
            }
        };

        javascriptGenerator.forBlock['fsm_init'] = function (/** @type {any} */ block: any) {

            const statements_init = javascriptGenerator.statementToCode(block, 'INIT');
            // TODO: Assemble JavaScript into code variable.
            const code = '...;\n';
            return code;
        };

        javascriptGenerator.forBlock['fsm_start'] = function (/** @type {any} */ block: any) {

            const statements_start = javascriptGenerator.statementToCode(block, 'START');
            // TODO: Assemble JavaScript into code variable.
            const code = '...;\n';
            return code;
        };


        // S'execute depuis un FSM
        javascriptGenerator.forBlock['fsm_update'] = function (/** @type {any} */ block: any) {

            const statements_update = javascriptGenerator.statementToCode(block, 'UPDATE');
            // TODO: Assemble JavaScript into code variable.
            const code = '...;\n';
            return code;
        };



        javascriptGenerator.forBlock['state_onenterstate'] = function (block, generator) {

            const statements_enterstate = generator.statementToCode(block, 'ENTERSTATE');
            // TODO: Assemble JavaScript into code variable.
            const code = `this.onEnterState.add(() => {\n ${statements_enterstate} } );\n`;
            return code;
        };

        javascriptGenerator.forBlock['state_onupdatestate'] = function (block: any, generator: any) {

            const statements_updatestate = generator.statementToCode(block, 'UPDATESTATE');
            // TODO: Assemble JavaScript into code variable.
            const code = `this.onUpdateState.add(() => {\n${statements_updatestate}});\n`;
            return code;
        };


        javascriptGenerator['state_onexitstate'] = function (block: any, generator: any) {

            const statements_onexitstate = generator.statementToCode(block, 'ONEXITSTATE');
            // TODO: Assemble JavaScript into code variable.
            const code = "this.onExitState = () => {\n" + statements_onexitstate + "}\n";
            return code;
        };
    }
}


