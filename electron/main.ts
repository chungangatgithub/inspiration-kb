import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/canvas');
  } else {
    // In production, start the Next.js server or load from static export
    const { createServer } = require('http');
    const { parse } = require('url');
    const next = require('next');
    const nextApp = next({ dev: false, dir: path.join(__dirname, '..') });
    nextApp.prepare().then(() => {
      const handle = nextApp.getRequestHandler();
      createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
      }).listen(3000, () => {
        mainWindow?.loadURL('http://localhost:3000/canvas');
      });
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.loadURL('http://localhost:3000/capture');
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
