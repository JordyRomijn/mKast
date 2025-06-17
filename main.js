const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let config;

function createWindow() {
  // Create the main window with arcade-specific settings
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Load the main HTML file
  mainWindow.loadFile('index.html');
  // Prevent window from being closed by user normally
  mainWindow.on('close', (event) => {
    // Only prevent close if not explicitly exiting
    if (!app.isQuitting) {
      event.preventDefault();
    }
  });

  // Disable all keyboard shortcuts that could exit fullscreen
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  // Load configuration
  loadConfig();
  
  createWindow();

  // Disable all system shortcuts that could interfere
  globalShortcut.register('Alt+F4', () => {
    // Prevent Alt+F4 from closing the app
    return false;
  });

  globalShortcut.register('F11', () => {
    // Prevent F11 from toggling fullscreen
    return false;
  });

  // globalShortcut.register('Escape', () => {
  //   // Prevent Escape from exiting fullscreen
  //   return false;
  // });

  // Allow Alt+Tab for now (commented out to allow task switching)
  // globalShortcut.register('Alt+Tab', () => {
  //   return false;
  // });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    // Prevent DevTools
    return false;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Allow app to quit when explicitly requested
  if (app.isQuitting) {
    app.quit();
  }
});

// Handle password verification for exit
ipcMain.handle('verify-exit-password', (event, password) => {
  return password === config.security.exitPassword;
});

// Handle password verification for admin panel
ipcMain.handle('verify-admin-password', (event, password) => {
  return password === config.security.adminPassword;
});

// Handle getting configuration
ipcMain.handle('get-config', () => {
  return config;
});

// Handle saving configuration
ipcMain.handle('save-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig();
  return true;
});

// Handle actual app exit
ipcMain.handle('exit-application', () => {
  app.isQuitting = true;
  app.quit();
});

// Handle file browser dialog
ipcMain.handle('browse-for-file', async (event, fileType = 'executable') => {
  try {
    let filters = [];
    let title = 'Selecteer een bestand';
    
    if (fileType === 'executable') {
      filters = [
        { name: 'Executable Files (*.exe)', extensions: ['exe'] },
        { name: 'Batch Files (*.bat, *.cmd)', extensions: ['bat', 'cmd'] },
        { name: 'All Files', extensions: ['*'] }
      ];
      title = 'Selecteer Game Executable';
    } else if (fileType === 'image') {
      filters = [
        { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ];
      title = 'Selecteer Game Afbeelding';
    }
    
    const result = await dialog.showOpenDialog(mainWindow, {
      title: title,
      buttonLabel: 'Selecteren',
      filters: filters,
      properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      let selectedPath = result.filePaths[0];
      
      // Handle .lnk files by resolving them
      if (selectedPath.endsWith('.lnk')) {
        try {
          // Try to resolve the shortcut to get the actual target
          const fs = require('fs');
          const path = require('path');
          
          // Read the .lnk file to try to extract target path
          // This is a simplified approach - for production, you might want to use a proper .lnk parser
          const stats = fs.statSync(selectedPath);
          if (stats.isFile()) {
            return {
              path: selectedPath,
              isShortcut: true,
              warning: 'Snelkoppeling geselecteerd. Voor beste resultaten, navigeer naar de installatiemap en selecteer het .exe bestand direct.'
            };
          }        } catch (error) {
          return {
            path: selectedPath,
            isShortcut: true,
            warning: 'Snelkoppeling geselecteerd. Dit kan problemen veroorzaken bij het starten. Probeer het originele .exe bestand te vinden.'
          };
        }
      }
      
      return {
        path: selectedPath,
        isShortcut: false
      };
    }
    return null;
  } catch (error) {
    console.error('Error in file browser:', error);
    return null;
  }
});

// Handle game launching
ipcMain.handle('launch-game', async (event, gamePath) => {
  try {
    const { spawn } = require('child_process');
    const gameProcess = spawn(gamePath, [], { 
      detached: true,
      stdio: 'ignore'
    });
    
    gameProcess.unref(); // Allow parent to exit independently
    
    return { success: true, message: 'Game gestart!' };
  } catch (error) {
    console.error('Error launching game:', error);
    return { success: false, message: `Fout bij starten game: ${error.message}` };
  }
});

// Load configuration from file
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('Error loading config:', error);
    // Use default config if file doesn't exist
    config = {
      security: {
        exitPassword: "arcade2025",
        adminPassword: "admin123"
      },
      branding: {
        instituteName: "Haagse Hogeschool",
        projectName: "mKast Arcade Launcher",
        version: "1.0.0"
      }
    };
  }
}

// Save configuration to file
function saveConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Global error handlers to prevent crashes and external dialogs
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-error-notification', {
      title: 'Systeem Fout',
      message: 'Er is een onverwachte fout opgetreden.',
      type: 'error'
    });
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-error-notification', {
      title: 'Systeem Fout', 
      message: 'Er is een onverwachte fout opgetreden bij een bewerking.',
      type: 'error'
    });
  }
});
