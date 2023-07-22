import Blockly from 'blockly';

export default Blockly.Theme.defineTheme('lusine-gm-dark', {

  'base': Blockly.Themes.Classic,
  'componentStyles': {
    'workspaceBackgroundColour': '#1e1e1e',
    'toolboxBackgroundColour': 'blackBackground',
    'toolboxForegroundColour': '#fff',
    'flyoutBackgroundColour': '#252526',
    'flyoutForegroundColour': '#ccc',
    'flyoutOpacity': 1,
    'scrollbarColour': '#797979',
    'insertionMarkerColour': '#fff',
    'insertionMarkerOpacity': 0.3,
    'scrollbarOpacity': 0.4,
    'cursorColour': '#d0d0d0',
    'blackBackground': '#333',
  },
  'blockStyles': {  
    'fsm_event_blocks': { // this.setStyle('fsm_event_blocks') à mettre dans la définition du block; 
      'colourPrimary' : "120",
      'hat': 'cap'
    }
    // 'list_blocks': {
    //   'colourPrimary': "#4a148c",
    //   'colourSecondary': "#AD7BE9",
    //   'colourTertiary': "#CDB6E9",
    // },
    // 'logic_blocks': {
    //   'colourPrimary': "#8b4513",
    //   'colourSecondary': "#ff0000",
    //   'colourTertiary': "#C5EAFF"
    // },
    // 'loop_blocks': {
    //   'colourPrimary': "#85E21F",
    //   'colourSecondary': "#ff0000",
    //   'colourTertiary': "#C5EAFF"
    // },
    // 'text_blocks': {
    //   'colourPrimary': "#FE9B13",
    //   'colourSecondary': "#ff0000",
    //   'colourTertiary': "#C5EAFF"
    // },
  },
});
