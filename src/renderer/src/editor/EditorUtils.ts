export default class EditorUtils {

    static showErrorMsg(message : string="",title : string = "error") {
        const { dialog } = require('@electron/remote');

        const options = {
            type: 'error',
            title: title,
            message: message,
          };

          dialog.showMessageBoxSync(options);
    }
}