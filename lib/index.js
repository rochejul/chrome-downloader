'use strict';

// Imports
const path = require('path');
const url = require('url');

const ChromeDownloader = require('./chrome-downloader');
const Logger = require('./logger');

// Constants
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Listen some basics events
  process.on('uncaughtException', err => {
    Logger.error(err);
  });

  process.on('unhandledRejection', (reason, p) => {
    Logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  });

  process.on('warning', warning => {
    Logger.warn(warning);
  });

  // Setup the application
  ChromeDownloader.initDefaultRcFile();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    'resizable': false,
    'width': 900,
    'height': 800,
    'icon': path.resolve(path.join(__dirname, '../app/app.ico'))
  });

  // Disable menu
  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    'pathname': path.resolve(path.join(__dirname, '../app/index.html')),
    'protocol': 'file:',
    'slashes': true
  }));

  // Open the DevTools.
  if (process.env.NODE_ENV === 'dev') {
    // We are in development process
    require('devtron').install();
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // When a new window should be open
  mainWindow.webContents.on('new-window', (event, externalUrl) => {
    // stop Electron from opening another BrowserWindow
    event.preventDefault();
    // open the url in the default system browser
    shell.openExternal(externalUrl);
  });

  // Listen IPC events
  ipcMain.on('ipcEventProject--application-loaded', (event, xslFilePath) => {
    // Create the menu
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          'label': 'View',
          'submenu': [
            {
              'label': 'Display only donwloaded release',
              'type': 'checkbox',
              'checked': false,
              'click': function (menuItem) {
                let firstBrowserWindow = BrowserWindow.getAllWindows()[0];
                firstBrowserWindow.webContents.send(
                  'ipcEventProject--menu-view-display-only-downloaded-release',
                  menuItem.checked
                );
              }
            }
          ]
        }
      ])
    );
  });
}

// Try to be sure to have only one instance
let shouldQuit = app.makeSingleInstance(() => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
