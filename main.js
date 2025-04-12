const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let tray;
let isWindowVisible = false;

app.whenReady().then(() => {
    createWindow();
    createTray();
});

// Ensure separate userData path
const customUserDataPath = path.join(app.getPath('appData'), 'ytmusic-app');
app.setPath('userData', customUserDataPath);

function createWindow() {
    win = new BrowserWindow({
        width: 450,
        height: 600,
        show: false,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.on('blur', () => {
        // Only hide if the dev tools aren't focused
        if (!win.webContents.isDevToolsFocused()) {
            win.hide();
        }
    });

    // Reset visibility flag when the window hides (e.g., user clicks away)
    win.on('hide', () => {
        isWindowVisible = false;
    });

    win.loadURL('https://music.youtube.com');
}

function createTray() {
    var icon = nativeImage.createFromPath(path.join(__dirname, 'icon@2x.png'));
    icon.setTemplateImage(true)
    tray = new Tray(icon);

    tray.on('click', async (_event, bounds) => {
        if (isWindowVisible) {
            win.hide();
            isWindowVisible = false;
            return;
        }

        // Position and show the window
        const { x, y } = bounds;
        const { width, height } = win.getBounds();
        const trayY = process.platform === 'darwin' ? y : y - height;

        win.setBounds({
            x: Math.round(x - width / 2),
            y: trayY,
            width,
            height,
        });

        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win.setAlwaysOnTop(true, 'floating');
        win.show();
        win.focus();
        isWindowVisible = true;
    });

    tray.setToolTip('YouTube Music');

    tray.on('right-click', async (_event, _bounds) => {
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Quit', click: () => app.quit() },
        ]);
        tray.popUpContextMenu(contextMenu);
    })
}


app.on('window-all-closed', (e) => {
    e.preventDefault(); // Keep app alive even when window is closed
});
