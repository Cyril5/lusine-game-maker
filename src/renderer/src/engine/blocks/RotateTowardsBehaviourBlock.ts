import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

export default class RotateTowardsBehaviourBlock {



    static init() {
        Blockly.Blocks['bvhrotatetowards_lookatspeed_gameobject_wuro3t'] = {
            init: function () {
                this.appendValueInput("OBJ")
                    .setCheck("GameObject")
                    .appendField("Regarder dans la direction de l'objet");
                this.appendValueInput("SPEED")
                    .setCheck("Number")
                    .appendField("à une vitesse de");
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(260);
                this.setTooltip("Pivote dans la direction de l'objet à une certaine vitesse");
                this.setHelpUrl("");
            }
        };

        // ROTATE TOWARDS BEHAVIOUR
        javascriptGenerator.forBlock['bvhrotatetowards_lookatspeed_gameobject_wuro3t'] = function (block, generator) {
            const value_obj = generator.valueToCode(block, 'OBJ', generator.ORDER_ATOMIC);
            const value_speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC);
            // TODO: Assemble javascript into code variable.
            const code = `this.gameObject.rotateTowardsBehaviour.lookAtSpeed(${value_obj}.transform,'XYZ',${value_speed});`;
            return code;
        };
    }
}

