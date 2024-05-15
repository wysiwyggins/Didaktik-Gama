const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const expressServer = require('./server.js');

let mainWindow;
let sharedState = {
  judgeName: ''
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile('public/index.html'); // Adjust the path to your entry HTML file

  mainWindow.webContents.openDevTools(); // Enable DevTools

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Set the environment variable before starting the server
  process.env.ELECTRON = true;
  expressServer.start(); // Start the Express server
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-shared-state', () => {
  console.log('Shared state updated:', sharedState);
});
