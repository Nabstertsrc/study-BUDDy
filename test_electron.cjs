const electron = require('electron');
console.log('--- Electron require debug ---');
console.log('electron type:', typeof electron);
console.log('electron keys:', Object.keys(electron).join(', '));
console.log('app type:', typeof electron.app);
console.log('------------------------------');
if (electron.app) {
    console.log('app name:', electron.app.name);
}
