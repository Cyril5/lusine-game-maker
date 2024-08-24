import { app, shell, BrowserWindow, dialog} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

require('@electron/remote/main').initialize();

const WINDOW_WIDTH = 1920; //defaut : 900
const WINDOW_HEIGHT = 1080; //700


app.commandLine.appendSwitch('enable-unsafe-webgpu');

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }


  })

  require("@electron/remote/main").enable(mainWindow.webContents);

  // Interceptez les messages de la console DevTools et envoyez-les au processus de rendu
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    // Envoyez le message au processus de rendu
    // 3 pour les erreurs
    if(level===3) {
      mainWindow.webContents.send('console-message', { level, message, line, sourceId });
      const options = {
        type: 'error',
        buttons: ['Ok'],
        defaultId: 0,
        title: 'Erreur',
        message: 'Erreur : '+message,
        detail: `${sourceId} : ${line}`};

        dialog.showMessageBox(null, options);
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow();



  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });


})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.


