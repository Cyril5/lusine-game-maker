import * as Blockly from 'blockly/core';
import { javascriptGenerator as jsGen, Order } from 'blockly/javascript';

export function registerGenerators() {

    jsGen.forBlock['lgm_custom_code_xPKZqW'] = function (block: any) {
        // TODO: change Order.ATOMIC to the correct operator precedence strength
        const value_code = javascriptGenerator.valueToCode(block, 'CODE', Order.ATOMIC);

        // TODO: Assemble javascript into the code variable.
        const code = '...';
        return code;
    };

    jsGen.forBlock['lgm_gameobject_move_am9hZB'] = function (block: any) {
        const checkbox_move_rigidbody = block.getFieldValue('MOVE_RIGIDBODY');
        // TODO: change Order.ATOMIC to the correct operator precedence strength
        const value_gameobject = javascriptGenerator.valueToCode(block, 'GAMEOBJECT', Order.ATOMIC);

        const dropdown_direction = block.getFieldValue('DIRECTION');
        // TODO: change Order.ATOMIC to the correct operator precedence strength
        const value_speed = javascriptGenerator.valueToCode(block, 'SPEED', Order.ATOMIC);

        let code = '';
        if (checkbox_move_rigidbody) {
            code = `rigidbody.addForce(${value_speed})`;
        }

        // TODO: Assemble javascript into the code variable.
        return code;
    }

    jsGen.forBlock['babylon_camera_construct_xBSebRq1'] = function (block:any) {
        // TODO: change Order.ATOMIC to the correct operator precedence strength
        const value_name = jsGen.valueToCode(block, 'NAME', Order.ATOMIC);

        // TODO: change Order.ATOMIC to the correct operator precedence strength
        const value_pos = jsGen.valueToCode(block, 'POS', Order.ATOMIC);

        // TODO: change Order.ATOMIC to the correct operator precedence strength
        const value_default = jsGen.valueToCode(block, 'DEFAULT', Order.ATOMIC);

        // TODO: Assemble javascript into the code variable.
        const code = `new BABYLON.Camera("${value_name}", ${value_pos});`;
        // TODO: Change Order.NONE to the correct operator precedence strength
        return [code, Order.NONE];
    }
}