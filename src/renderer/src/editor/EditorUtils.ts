import StateEditorUtils from "./StateEditorUtils";
import LGM3DEditor from "./LGM3DEditor";
import { EditorAlertType } from "@renderer/components/EditorAlert";

const { dialog } = require('@electron/remote');
const { app } = require('@electron/remote');
const prompt = require('electron-prompt');

export default class EditorUtils {

  static readonly VERSION: string = 'Alpha 0.2.7';
  static readonly EDITOR_TAG: string = '_EDITOR_TAG_';

  //TODO : à peut être déplacer dans StateEditorUtils
  static updateStatesFilesList() {
    LGM3DEditor.getInstance().states.setStateFiles(StateEditorUtils.getStatesFiles());
  }

  static path = require('path'); //TODO : getter
  //static app = require('app');

  static get appPath(): string {
    return app.getAppPath();
  }

  static showMsgDialog(options: { type: string; title: string; message: string; buttons: string[]; defaultId: number; cancelId?: number; }): number {
    return dialog.showMessageBoxSync(options);
  }


  static openInputDialog(options: {}, onSuccess: (response: any) => any, onError?: (error: any) => any) {
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
          properties: ['openDirectory'],
        }
      ).then((result) => {
        console.log(result);
        resolve(result); // Resolving the promise with the selected file/directory paths
      });
    });
  }

  static openFileDialog(options: {}, onSuccess: (response: any) => any, onError?: (error: any) => any) {
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

  static showErrorMsg(message: string = "", title: string = "error") {

    const options = {
      type: 'error',
      title: title,
      message: message,
    };

    dialog.showMessageBoxSync(options);
  }

  static showInfoMsg(message: string = "", title: string = "Lusine Game Maker 3D") {
    const options = {
      type: 'info',
      title: title,
      message: message,
    };

    dialog.showMessageBoxSync(options);
  }

  static showWarnMsg(message: string = "", Error: EditorAlertType, p0: () => void, title: string = "Lusine Game Maker 3D") {

    const options = {
      type: 'warning',
      title: title,
      message: message,
    };

    dialog.showMessageBoxSync(options);
  }
}