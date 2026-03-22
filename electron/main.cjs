const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

// CRITICAL FIX: Force a brand new data directory name to bypass any corrupted 'ai-study-buddy' folders
if (app) {
    app.name = "NabsterStudyBuddy_v6";
} else {
    console.error("Electron 'app' module is undefined! Ensuring correct require...");
}

// Disable GPU acceleration as it can sometimes lock the storage engine
if (app && app.disableHardwareAcceleration) {
    app.disableHardwareAcceleration();
}

// SINGLE INSTANCE LOCK: Prevent data corruption from multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

let mainWindow;
let tray;
let pythonProcess;
let goProcess;
let localServerPort;

/**
 * Starts a micro-server to host the frontend on localhost instead of file://
 * This fixes the "Storage Access Failure" on Windows by providing a standard web context.
 */
function startProductionServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let urlPath = req.url.split('?')[0].split('#')[0];
            if (urlPath === '/' || !urlPath) urlPath = '/index.html';
            if (urlPath.startsWith('/')) urlPath = urlPath.substring(1);

            const appBase = app.getAppPath();
            let filePath = path.join(appBase, 'dist', urlPath);

            // Fallback for React Router (serve index.html if file doesn't exist)
            if (!fs.existsSync(filePath) && !path.extname(urlPath)) {
                filePath = path.join(appBase, 'dist', 'index.html');
            }

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    console.error(`Server Error: ${urlPath} -> ${filePath} (Not Found)`);
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
                    '.jpeg': 'image/jpeg',
                    '.svg': 'image/svg+xml',
                    '.json': 'application/json',
                    '.webmanifest': 'application/manifest+json',
                    '.ico': 'image/x-icon'
                }[ext] || 'application/octet-stream';

                res.setHeader('Content-Type', contentType);
                res.end(data);
            });
        });

        // Use a fixed port for consistent IndexedDB origin
        // If 51730 is taken, port 0 will pick a random one as fallback
        const preferredPort = 51730;

        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.warn(`Port ${preferredPort} in use, picking another...`);
                server.listen(0, '127.0.0.1');
            }
        });

        server.listen(preferredPort, '127.0.0.1', () => {
            localServerPort = server.address().port;
            console.log(`Frontend micro-server running on port ${localServerPort}`);
            resolve(localServerPort);
        });
    });
}

function startSidecars() {
    // In production, files are unpacked to 'resources/app.asar.unpacked'
    const isPackaged = app.isPackaged;
    const baseDir = isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked')
        : app.getAppPath();

    const pythonPath = 'python';
    const pythonScript = path.join(baseDir, 'backend/python/analyzer.py');

    console.log(`Checking Sidecars... 
    Python Script: ${pythonScript} (Exists: ${fs.existsSync(pythonScript)})
    Mode: ${isPackaged ? 'Packaged' : 'Dev'}`);

    if (fs.existsSync(pythonScript)) {
        try {
            pythonProcess = spawn(pythonPath, [pythonScript]);
            pythonProcess.stdout.on('data', (data) => console.log(`Python: ${data}`));
            pythonProcess.stderr.on('data', (data) => console.error(`Python Error: ${data}`));
            pythonProcess.on('error', (err) => console.error('Failed to start Python sidecar:', err));
        } catch (e) {
            console.error('Python spawn exception:', e);
        }
    }

    // Go Search Sidecar
    const goPath = isPackaged
        ? path.join(baseDir, 'backend/go/main.exe')
        : 'go';
    const goScript = path.join(baseDir, 'backend/go/main.go');

    try {
        if (!isPackaged) {
            goProcess = spawn('go', ['run', goScript]);
        } else if (fs.existsSync(goPath)) {
            goProcess = spawn(goPath);
        } else {
            console.warn('Go binary missing in production - search will be disabled');
        }

        if (goProcess) {
            goProcess.stdout.on('data', (data) => console.log(`Go: ${data}`));
            goProcess.stderr.on('data', (data) => console.error(`Go Error: ${data}`));
        }
    } catch (e) {
        console.warn('Go spawn exception:', e);
    }
}

function stopSidecars() {
    if (pythonProcess) pythonProcess.kill();
    if (goProcess) goProcess.kill();
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1240,
        height: 850,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            sandbox: false, // Disabled - can cause blank screen in some configs
        },
        icon: path.join(__dirname, '../public/icon.png'),
        autoHideMenuBar: true,
    });

    // Explicitly remove the default window menu so no side/top menu appears
    mainWindow.removeMenu();

    let attemptedURL = '';

    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    const hasLocalDist = fs.existsSync(indexPath);

    if (!app.isPackaged && !hasLocalDist) {
        // Development mode - load from Vite dev server if dist doesn't exist locally
        const startURL = 'http://127.0.0.1:5173';
        console.log('Loading URL:', startURL);
        attemptedURL = startURL;
        mainWindow.loadURL(startURL);
    } else {
        // Production mode - Use the local server URL method
        if (!localServerPort) {
            await startProductionServer();
        }
        const startURL = `http://127.0.0.1:${localServerPort}`;
        console.log('Loading via URL method:', startURL);
        attemptedURL = startURL;
        mainWindow.loadURL(startURL);
    }

    // Log any loading errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
        console.error('Attempted URL:', attemptedURL);
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log('Renderer:', message);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    const iconPath = path.join(__dirname, '../public/icon.png');
    if (!fs.existsSync(iconPath)) return;

    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Nabster Tsr Buddy', click: () => mainWindow.show() },
        { type: 'separator' },
        {
            label: 'Quit', click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Nabster Tsr Study Buddy');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

app.whenReady().then(() => {
    // Register custom protocol for local files to avoid disabling webSecurity
    protocol.registerFileProtocol('study-file', (request, callback) => {
        const url = request.url.replace('study-file://', '');
        try {
            return callback(decodeURIComponent(url));
        } catch (error) {
            console.error('Failed to register protocol', error);
        }
    });

    startSidecars();
    createWindow();
    createTray();
    setupAutoOpenChecker();
});

app.on('will-quit', () => {
    stopSidecars();
});

function setupAutoOpenChecker() {
    // Check every hour
    setInterval(() => {
        if (mainWindow) {
            mainWindow.webContents.send('request-deadline-check');
        }
    }, 1000 * 60 * 60);
}

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Helper for https requests
function makeRequest(url, method, headers, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
                resolve({ status: isSuccess, statusCode: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => resolve({ status: false, error: e.message }));
        if (body) req.write(body);
        req.end();
    });
}

// IPC Handlers
ipcMain.handle('check-ai-status', async (event, { openai, grok, deepseek, gemini }) => {
    const results = {
        openai: { status: false },
        grok: { status: false },
        deepseek: { status: false },
        gemini: { status: false }
    };

    // 1. Check OpenAI
    if (openai) {
        try {
            const res = await makeRequest('https://api.openai.com/v1/models', 'GET', {
                'Authorization': `Bearer ${openai}`
            });
            results.openai = { status: res.status, model: 'gpt-4o', error: res.status ? null : `Status ${res.statusCode}` };
        } catch (e) { results.openai.error = e.message; }
    }

    // 2. Check Grok (xAI) - standard OpenAI compatible endpoint
    if (grok) {
        try {
            const res = await makeRequest('https://api.x.ai/v1/models', 'GET', {
                'Authorization': `Bearer ${grok}`
            });
            results.grok = { status: res.status, model: 'grok-4-latest', error: res.status ? null : `Status ${res.statusCode}` };
        } catch (e) { results.grok.error = e.message; }
    }

    // 3. Check DeepSeek
    if (deepseek) {
        try {
            const res = await makeRequest('https://api.deepseek.com/models', 'GET', {
                'Authorization': `Bearer ${deepseek}`
            });
            results.deepseek = { status: res.status, model: 'deepseek-chat', error: res.status ? null : `Status ${res.statusCode}` };
        } catch (e) { results.deepseek.error = e.message; }
    }

    // 4. Check Gemini
    if (gemini) {
        try {
            // Gemini requires key in query parameter for simple GET, or POST to generate
            const res = await makeRequest(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${gemini}`,
                'GET', {}
            );
            results.gemini = { status: res.status, model: 'gemini-1.5-flash', error: res.status ? null : `Status ${res.statusCode}` };
        } catch (e) { results.gemini.error = e.message; }
    }

    return results;
});

ipcMain.handle('save-file', async (event, { name, content }) => {
    const userDataPath = app.getPath('userData');
    const filesPath = path.join(userDataPath, 'stored_files');


    if (!fs.existsSync(filesPath)) {
        fs.mkdirSync(filesPath, { recursive: true });
    }

    const filePath = path.join(filesPath, name);
    fs.writeFileSync(filePath, Buffer.from(content));
    return filePath;
});

ipcMain.handle('get-file', async (event, name) => {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'stored_files', name);

    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    }
    return null;
});

ipcMain.handle('delete-file', async (event, name) => {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'stored_files', name);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
});

ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
});

ipcMain.handle('open-external-url', async (event, url) => {
    return shell.openExternal(url);
});

ipcMain.handle('download-url', async (event, { url, name }) => {
    const userDataPath = app.getPath('userData');
    const filesPath = path.join(userDataPath, 'stored_files');

    if (!fs.existsSync(filesPath)) {
        fs.mkdirSync(filesPath, { recursive: true });
    }

    const filePath = path.join(filesPath, name);
    const file = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
        const protocolObj = url.startsWith('https') ? https : http;
        protocolObj.get(url, (response) => {
            // Handle redirects (basic)
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                protocolObj.get(response.headers.location, (res) => {
                    res.pipe(file);
                });
            } else if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            } else {
                response.pipe(file);
            }

            file.on('finish', () => {
                file.close();
                resolve({ path: filePath, name });
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
});

// Auto-open logic (Mocking for now, will be triggered by renderer)

ipcMain.on('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
});

ipcMain.on('open-app-window', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    } else {
        createWindow();
    }
});
