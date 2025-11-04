const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store');
const BackendManager = require('./backend-manager');
const SaveManager = require('./save-manager');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Initialize configuration store
const store = new Store({
  defaults: {
    windowBounds: { width: 1400, height: 900 },
    autoStartBackend: true,
    backendPort: 9000,
    dbHost: 'localhost',
    dbPort: 3306,
    dbName: 'airline',
    dbUser: 'mfc01',
    dbPassword: 'ghEtmwBdnXYBQH4',
    startMinimized: false,
    theme: 'classic'
  }
});

class AirlineDesktopApp {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.backendManager = null;
    this.saveManager = null;
    this.isQuitting = false;
    this.currentMode = null; // 'singleplayer' or 'multiplayer'
  }

  async initialize() {
    log.info('Initializing FlightForge Desktop App...');
    
    // Set up application menu
    this.createApplicationMenu();
    
    // Initialize backend manager
    this.backendManager = new BackendManager(store, log);
    
    // Initialize save manager
    this.saveManager = new SaveManager(store, log);
    
    // Set up IPC handlers BEFORE creating window
    this.setupIpcHandlers();
    
    // Create main window
    await this.createMainWindow();
    
    // Create system tray (optional, comment out if no icon)
    // this.createTray();
    
    // Load menu screen instead of auto-starting
    this.showMenuScreen();
    
    log.info('FlightForge Desktop App initialized successfully');
  }

  async createMainWindow() {
    const bounds = store.get('windowBounds');
    
    this.mainWindow = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      minWidth: 1024,
      minHeight: 768,
      icon: path.join(__dirname, '../build/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
        webviewTag: false
      },
      show: false,
      backgroundColor: '#1a1a2e'
    });

    // Initially load menu screen
    const menuPath = `file://${path.join(__dirname, 'menu-screen.html')}`;
    this.mainWindow.loadURL(menuPath);
    
    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (!store.get('startMinimized')) {
        this.mainWindow.show();
      }
    });

    // Save window bounds on resize/move
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow.hide();
      } else {
        const bounds = this.mainWindow.getBounds();
        store.set('windowBounds', bounds);
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Open external links in default browser
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    // Handle navigation
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      const appUrl = `http://localhost:${store.get('backendPort')}`;
      if (!url.startsWith(appUrl) && !url.startsWith('data:')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });
  }

  createApplicationMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Return to Menu',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.showMenuScreen()
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showPreferences()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Backend',
        submenu: [
          {
            label: 'Start Backend',
            click: () => this.startBackend()
          },
          {
            label: 'Stop Backend',
            click: () => this.stopBackend()
          },
          {
            label: 'Restart Backend',
            click: () => this.restartBackend()
          },
          { type: 'separator' },
          {
            label: 'Start Simulation',
            click: () => this.startSimulation()
          },
          {
            label: 'Stop Simulation',
            click: () => this.stopSimulation()
          },
          { type: 'separator' },
          {
            label: 'View Logs',
            click: () => this.viewLogs()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin'
            ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
              ]
            : [{ role: 'close' }])
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://github.com/patsonluk/airline')
          },
          {
            label: 'Report Issue',
            click: () => shell.openExternal('https://github.com/patsonluk/airline/issues')
          },
          { type: 'separator' },
          {
            label: 'About',
            click: () => this.showAbout()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  createTray() {
    const iconPath = process.platform === 'darwin'
      ? path.join(__dirname, '../build/tray-icon-Template.png')
      : path.join(__dirname, '../build/tray-icon.png');
    
    this.tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show FlightForge',
        click: () => {
          this.mainWindow?.show();
        }
      },
      { type: 'separator' },
      {
        label: 'Start Backend',
        enabled: true,
        click: () => this.startBackend()
      },
      {
        label: 'Stop Backend',
        enabled: false,
        click: () => this.stopBackend()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('FlightForge - Airline Simulation');
    
    this.tray.on('click', () => {
      this.mainWindow?.show();
    });
  }

  setupIpcHandlers() {
    // Backend control
    ipcMain.handle('backend:start', async () => {
      return await this.startBackend();
    });

    ipcMain.handle('backend:stop', async () => {
      return await this.stopBackend();
    });

    ipcMain.handle('backend:status', async () => {
      return this.backendManager.getStatus();
    });

    // Simulation control
    ipcMain.handle('simulation:start', async () => {
      return await this.startSimulation();
    });

    ipcMain.handle('simulation:stop', async () => {
      return await this.stopSimulation();
    });

    // Configuration
    ipcMain.handle('config:get', async (event, key) => {
      return store.get(key);
    });

    ipcMain.handle('config:set', async (event, key, value) => {
      store.set(key, value);
      return true;
    });

    ipcMain.handle('config:getAll', async () => {
      return store.store;
    });

    // Save management
    ipcMain.handle('saves:list', async () => {
      return await this.saveManager.list();
    });

    ipcMain.handle('saves:createNew', async (event, saveName) => {
      return await this.saveManager.createNew(saveName);
    });

    ipcMain.handle('saves:load', async (event, saveId) => {
      return await this.saveManager.load(saveId);
    });

    ipcMain.handle('saves:delete', async (event, saveId) => {
      return await this.saveManager.delete(saveId);
    });

    ipcMain.handle('saves:getActive', async () => {
      return this.saveManager.getActiveSave();
    });

    // App control
    ipcMain.handle('app:quit', async () => {
      this.isQuitting = true;
      app.quit();
    });

    ipcMain.handle('app:returnToMenu', async () => {
      this.showMenuScreen();
    });

    ipcMain.handle('app:navigate', async (event, page) => {
      this.navigateToPage(page);
    });
  }

  showMenuScreen() {
    if (this.mainWindow) {
      const menuPath = `file://${path.join(__dirname, 'menu-screen.html')}`;
      this.mainWindow.loadURL(menuPath);
      this.currentMode = null;
    }
  }

  navigateToPage(page) {
    if (this.mainWindow) {
      const pagePath = `file://${path.join(__dirname, page)}`;
      log.info(`Navigating to: ${pagePath}`);
      this.mainWindow.loadURL(pagePath);
    }
  }

  async startBackend() {
    try {
      log.info('Starting backend...');
      const result = await this.backendManager.startWeb();
      
      if (result.success) {
        // Wait a bit for server to be fully ready
        await this.waitForBackend();
        
        // Load the application
        const port = store.get('backendPort');
        this.mainWindow?.loadURL(`http://localhost:${port}`);
        
        this.updateTrayMenu(true, false);
      }
      
      return result;
    } catch (error) {
      log.error('Failed to start backend:', error);
      dialog.showErrorBox('Backend Error', `Failed to start backend: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async stopBackend() {
    try {
      log.info('Stopping backend...');
      const result = await this.backendManager.stopAll();
      
      if (result.success) {
        this.mainWindow?.loadURL(`data:text/html,
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .container {
                text-align: center;
                padding: 40px;
              }
              .message {
                font-size: 32px;
                margin-bottom: 20px;
              }
              .subtitle {
                font-size: 16px;
                color: #a0a0a0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="message">⏸️ Backend Stopped</div>
              <div class="subtitle">Use the menu to start the backend</div>
            </div>
          </body>
          </html>
        `);
        this.updateTrayMenu(false, false);
      }
      
      return result;
    } catch (error) {
      log.error('Failed to stop backend:', error);
      return { success: false, error: error.message };
    }
  }

  async restartBackend() {
    await this.stopBackend();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startBackend();
  }

  async startSimulation() {
    try {
      log.info('Starting simulation...');
      const result = await this.backendManager.startSimulation();
      
      if (result.success) {
        this.updateTrayMenu(true, true);
      }
      
      return result;
    } catch (error) {
      log.error('Failed to start simulation:', error);
      dialog.showErrorBox('Simulation Error', `Failed to start simulation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async stopSimulation() {
    try {
      log.info('Stopping simulation...');
      const result = await this.backendManager.stopSimulation();
      
      if (result.success) {
        this.updateTrayMenu(true, false);
      }
      
      return result;
    } catch (error) {
      log.error('Failed to stop simulation:', error);
      return { success: false, error: error.message };
    }
  }

  async waitForBackend() {
    const port = store.get('backendPort');
    const maxAttempts = this.backendManager.isPreInitialized() ? 30 : 90; // Faster timeout for pre-init
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${port}/`);
        if (response.ok || response.status === 404) {
          log.info('Backend is ready');
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      // Update loading message periodically
      if (i % 5 === 0 && this.mainWindow) {
        const elapsed = i;
        const status = this.backendManager.isPreInitialized()
          ? 'Fast startup enabled - almost ready...'
          : elapsed < 30 
          ? 'Starting backend server...' 
          : elapsed < 60 
          ? 'Almost ready...' 
          : 'Still loading, please wait...';
        
        this.mainWindow.webContents.executeJavaScript(`
          if (document.querySelector('.status')) {
            document.querySelector('.status').innerHTML = 
              '<span class="spinner"></span>${status}';
          }
        `).catch(() => {});
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const timeout = this.backendManager.isPreInitialized() ? 30 : 90;
    throw new Error(`Backend failed to start within timeout (${timeout} seconds)`);
  }

  updateTrayMenu(backendRunning, simulationRunning) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show FlightForge',
        click: () => this.mainWindow?.show()
      },
      { type: 'separator' },
      {
        label: 'Start Backend',
        enabled: !backendRunning,
        click: () => this.startBackend()
      },
      {
        label: 'Stop Backend',
        enabled: backendRunning,
        click: () => this.stopBackend()
      },
      { type: 'separator' },
      {
        label: 'Start Simulation',
        enabled: backendRunning && !simulationRunning,
        click: () => this.startSimulation()
      },
      {
        label: 'Stop Simulation',
        enabled: simulationRunning,
        click: () => this.stopSimulation()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray?.setContextMenu(contextMenu);
  }

  showPreferences() {
    // TODO: Create preferences window
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Preferences',
      message: 'Preferences dialog coming soon!',
      detail: 'For now, configuration is stored in the app data directory.'
    });
  }

  viewLogs() {
    const logPath = log.transports.file.getFile().path;
    shell.showItemInFolder(logPath);
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About FlightForge',
      message: 'FlightForge Desktop',
      detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode: ${process.versions.node}\n\nAn open-source airline management simulation game.\nFork of Airline Club (airline-club.com)`
    });
  }

  async cleanup() {
    log.info('Cleaning up...');
    
    if (this.backendManager) {
      await this.backendManager.stopAll();
    }
    
    if (this.tray) {
      this.tray.destroy();
    }
  }
}

// Application lifecycle
const desktopApp = new AirlineDesktopApp();

app.whenReady().then(() => {
  desktopApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    desktopApp.createMainWindow();
  }
});

app.on('before-quit', async () => {
  desktopApp.isQuitting = true;
  await desktopApp.cleanup();
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  dialog.showErrorBox('Application Error', error.message);
});

process.on('unhandledRejection', (error) => {
  log.error('Unhandled rejection:', error);
});
