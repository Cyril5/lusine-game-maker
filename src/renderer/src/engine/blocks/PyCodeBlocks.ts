
import Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';

export class PyCodeBlocks {

    constructor() {

        pythonGenerator.forBlock['state_onenterstate'] = function (block, generator) {

            const statements_enterstate = generator.statementToCode(block, 'ENTERSTATE');
            //const indentedStatements = statements_enterstate.split('\n').map(line => `    ${line}`).join('\n');
            return `self.on_enter_state.add(lambda: (\n${statements_enterstate}\n))\n`;
        };
    }
}


