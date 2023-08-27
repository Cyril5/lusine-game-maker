import Editor from "@renderer/components/Editor";
import StateEditorUtils from "./StateEditorUtils";

const { dialog } = require('@electron/remote');
const {app} = require('@electron/remote');
const prompt = require('electron-prompt');

export default class EditorUtils {

    static updateStatesFilesList() {
        Editor.getInstance().setState({stateFiles:StateEditorUtils.statesFiles});
    }

    static path = require('path'); //TODO : getter
    //static app = require('app');
    
    static get appPath() : string {
      return app.getAppPath();
    }
    
    static showMsgDialog(options: { type: string; title: string; message: string; buttons: string[]; defaultId: number; cancelId?: number; }) : number {
        return dialog.showMessageBoxSync(options);
    }


    static openInputDialog(options: {}, onSuccess: (response: any) => any, onError?: (error : any)=>any) {
        prompt(options)
            .then((result: any) => {
                // Vérifie si l'utilisateur a annulé la boîte de dialogue (result sera null dans ce cas).
                    onSuccess(result);
            })
            .catch((error: any) => {
                // Gère les erreurs, si besoin.
                if (onError) {
                    onError(error);
                }
            });
    }

    
    static openDirectoryDialog(): Promise<Object | null> {
        return new Promise((resolve) => {
          dialog.showOpenDialog(
            {
              properties: ['openFile', 'openDirectory'],
            }
            ).then((result)=>{                
              resolve(result); // Resolving the promise with the selected file/directory paths
          });
        });
      }

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