// A chaque modif lancer npm run -w lgm3d-rigidbody-blocks build

import * as Blockly from 'blockly/core';
import {javascriptGenerator, Order} from 'blockly/javascript';

export function registerGenerators() {
  const js = javascriptGenerator;

  if(!js) console.error("blockly generator is undefined");

  js.forBlock["lgm_rb_add_force"] = function(block: any) {
    const v = js.valueToCode(block, "VEC", js.ORDER_NONE) || "{x:0,y:0,z:0}";
    return `this.rigidbody && this.rigidbody.addForce(${v});\n`;
  };

  js.forBlock["lgm_rb_set_velocity"] = function(block: any) {
    const v = js.valueToCode(block, "VEC", js.ORDER_NONE) || "{x:0,y:0,z:0}";
    return `this.rigidbody && this.rigidbody.setVelocity(${v});\n`;
  };

  js.forBlock["lgm_rb_get_velocity"] = function(_block: any) {
    return [`(this.rigidbody ? this.rigidbody.position /* or .getVelocity() */ : {x:0,y:0,z:0})`, js.ORDER_ATOMIC];
  };

  js.forBlock["lgm_rb_get_speed"] = function(_block: any) {
    // si tu as rigidbody.getVelocity(), sinon adapte
    return [`(function(){const v=(this.rigidbody?.getVelocity?.()||{x:0,y:0,z:0});return Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z);}()).call(this)`, js.ORDER_FUNCTION_CALL];
  };

  js.forBlock["lgm_rb_is_sleeping"] = function(_block: any) {
    return [`!!(this.rigidbody && this.rigidbody.isSleeping)`, js.ORDER_LOGICAL_NOT];
  };
}