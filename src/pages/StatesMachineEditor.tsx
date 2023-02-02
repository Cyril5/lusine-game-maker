import React, { useRef, useEffect, useState } from 'react';

import Blockly from 'blockly';
import toolboxXml from '../assets/blocks/toolbox.xml?raw'; // ?raw to import as string
import LusineBlocksDarkTheme from '../engine/blocks/themes/lusine-gm-dark'
import '../engine/blocks/blocksDefs';
import '@blockly/block-plus-minus';
import * as Fr from 'blockly/msg/fr';
import { Breadcrumb } from 'react-bootstrap';

const StatesMachineEditor = () => {

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item href="#">Objet</Breadcrumb.Item>
                <Breadcrumb.Item href="#">Nom Automate Fini</Breadcrumb.Item>
            </Breadcrumb>
        </>
    );
}
export default StatesMachineEditor