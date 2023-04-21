import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

export class FSMBlocks {

    constructor() {

        // alert("import fsm blocks");

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

        javascriptGenerator['fsm_init'] = function (/** @type {any} */ block: any) {

            const statements_init = javascriptGenerator.statementToCode(block, 'INIT');
            // TODO: Assemble JavaScript into code variable.
            const code = '...;\n';
            return code;
        };

        javascriptGenerator['fsm_start'] = function (/** @type {any} */ block: any) {

            const statements_start = javascriptGenerator.statementToCode(block, 'START');
            // TODO: Assemble JavaScript into code variable.
            const code = '...;\n';
            return code;
        };


        // S'execute depuis un FSM
        javascriptGenerator['fsm_update'] = function (/** @type {any} */ block: any) {

            const statements_update = javascriptGenerator.statementToCode(block, 'UPDATE');
            // TODO: Assemble JavaScript into code variable.
            const code = '...;\n';
            return code;
        };

        javascriptGenerator['state_onenterstate'] = function (block) {

            const statements_enterstate = javascriptGenerator.statementToCode(block, 'ENTERSTATE');
            // TODO: Assemble JavaScript into code variable.
            const code = "this.onEnterState = () => {\n" + statements_enterstate + "}\n";
            return code;
        };

        javascriptGenerator['state_onupdatestate'] = function (/** @type {any} */ block: any) {

            const statements_updatestate = javascriptGenerator.statementToCode(block, 'UPDATESTATE');
            // TODO: Assemble JavaScript into code variable.
            const code = "this.onUpdateState = () => {\n" + statements_updatestate + "}\n";
            return code;
        };


        javascriptGenerator['state_onexitstate'] = function (/** @type {any} */ block: any) {

            const statements_onexitstate = javascriptGenerator.statementToCode(block, 'ONEXITSTATE');
            // TODO: Assemble JavaScript into code variable.
            const code = "this.onExitState = () => {\n" + statements_onexitstate + "}\n";
            return code;
        };
    }
}


