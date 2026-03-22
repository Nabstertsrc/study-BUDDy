const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Windows-optimized configuration
app.name = "NabsterStudyBuddy_Windows";
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  // Windows-specific window configuration
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      // Windows optimizations
      experimentalFeatures: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.removeMenu();

  // Load the production build
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: serve from local HTTP server
    startProductionServer().then(port => {
      mainWindow.loadURL(`http://localhost:${port}`);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startProductionServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0].split('#')[0];
      if (urlPath === '/' || !urlPath) urlPath = '/index.html';
      if (urlPath.startsWith('/')) urlPath = urlPath.substring(1);

      const baseDir = path.join(__dirname, '..', 'dist');
      const filePath = path.join(baseDir, urlPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        const ext = path.extname(filePath);
        const contentType = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.json': 'application/json'
        }[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    // Use random available port
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Production server running on port ${port}`);
      resolve(port);
    });
  });
}

// Windows app event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC handlers for Windows
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('platform', () => {
  return process.platform;
});