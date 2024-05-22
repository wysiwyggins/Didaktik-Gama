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
    fullscreen: true, // Open in fullscreen mode
    fullscreenable: true, // Allow fullscreen toggle
    autoHideMenuBar: true, // Hide menu bar in fullscreen
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile('public/index.html'); // Adjust the path to your entry HTML file

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools(); // Enable DevTools only in development
  }

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
  console.log('Shared state retrieved:', sharedState);
  return sharedState;
});

ipcMain.handle('set-shared-state', (event, newState) => {
  sharedState = { ...sharedState, ...newState };
  console.log('Shared state updated:', sharedState);
});

// Handle navigation IPC
ipcMain.on('navigate', (event, url) => {
  if (mainWindow) {
    mainWindow.loadFile(`public/${url}`);
  }
});

// Handle quit IPC
ipcMain.on('quit-app', () => {
  app.quit();
});
