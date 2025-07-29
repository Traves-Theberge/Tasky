const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const ReminderScheduler = require('./electron/scheduler');
const TaskyStore = require('./electron/storage');
const ClippyAssistant = require('./electron/assistant');
// const CustomNotificationWindow = require('./electron/customNotification'); // Removed - Clippy handles all notifications

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Set AppUserModelID for Windows notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tasky.reminderapp');
}

let mainWindow;
let tray = null;
let scheduler = null;
let store = null;
let assistant = null;
// let customNotifications = null; // Removed - Clippy handles all notifications

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
    minWidth: 450,
    maxWidth: 450,
    minHeight: 650,
    maxHeight: 650,
    resizable: false, // Disable window resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/app-icon.png'),
    show: false, // Don't show initially as this is a tray app
    skipTaskbar: true,
    frame: false, // Remove the entire window frame
    titleBarStyle: 'hidden',
    autoHideMenuBar: true, // Hide the menu bar
  });

  // Remove the menu bar completely
  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  // These constants are injected by Electron Forge Vite plugin
  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererName = typeof MAIN_WINDOW_VITE_NAME !== 'undefined' ? MAIN_WINDOW_VITE_NAME : 'main_window';
    mainWindow.loadFile(path.join(__dirname, `../renderer/${rendererName}/index.html`));
  }

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Hide window instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Initialize storage
  store = new TaskyStore();
  store.migrate(); // Run any necessary migrations
  
  // Custom notifications removed - Clippy handles all notifications
  
  // Initialize scheduler
  scheduler = new ReminderScheduler();
  
  // Load saved reminders and settings
  const savedReminders = store.getReminders();
  const settings = store.getAllSettings();
  
  // Initialize Clippy assistant with saved avatar
  assistant = new ClippyAssistant();
  const savedAvatar = settings.selectedAvatar || 'Clippy';
  assistant.setAvatar(savedAvatar);
  
  // Apply animation setting
  const enableAnimation = settings.enableAnimation !== undefined ? settings.enableAnimation : true;
  setTimeout(() => {
    if (assistant && assistant.window) {
      assistant.window.webContents.send('toggle-animation', enableAnimation);
    }
  }, 3000);
  
  // Apply settings to scheduler
  scheduler.toggleNotifications(settings.enableNotifications);
  scheduler.toggleSound(settings.enableSound);
  scheduler.setNotificationType(settings.notificationType || 'custom');
  
  // Configure auto-launch if enabled
  if (settings.autoStart) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      name: 'Tasky',
      args: ['--hidden']
    });
  }
  
  // Load reminders into scheduler
  scheduler.loadReminders(savedReminders);
  
  // Show desktop companion if enabled
  if (settings.enableAssistant) {
    setTimeout(() => {
      console.log('Starting Clippy desktop companion...');
      console.log('Assistant available:', !!assistant);
      try {
        if (assistant) {
          console.log('Creating persistent desktop companion');
          assistant.show(); // Show without message first
          
          // Welcome message after companion is positioned
          setTimeout(() => {
            console.log('Sending welcome message to Clippy');
            assistant.speak("Hello! I'm your Tasky companion! I'll be here to deliver your reminders. 📋✨");
          }, 3000);
        } else {
          console.error('Assistant instance is null!');
        }
      } catch (error) {
        console.error('Error starting desktop companion:', error);
      }
    }, 2000); // Increased delay to ensure everything is loaded
  } else {
    console.log('Desktop companion disabled in settings');
  }
  
  createWindow();
  createTray();
  
  // If launched with --hidden argument, don't show the window initially
  if (process.argv.includes('--hidden')) {
    if (mainWindow) {
      mainWindow.hide();
    }
  }

  // Make mainWindow and assistant globally available for scheduler
  global.mainWindow = mainWindow;
  global.assistant = assistant;

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (e) => {
  // Prevent quitting when windows are closed (tray app behavior)
  e.preventDefault();
});

// Function to create system tray
const createTray = () => {
  // Create a simple 16x16 reminder icon using data URL
  const iconDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGESURBVDiNpZM7SwNBFIWfgwQLwcJCG1sLwcJCG1sLG0uxsLG0sLGwsLGwsLBQsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsA==';
  let trayIcon;
  
  // Try to load custom icon first, fallback to data URL
  // Try multiple possible paths for the tray icon
  const possiblePaths = [
    path.join(__dirname, '../assets/tray-icon.png'),
    path.join(__dirname, '../../src/assets/tray-icon.png'),
    path.join(process.cwd(), 'src/assets/tray-icon.png')
  ];
  
  let iconPath = null;
  for (const testPath of possiblePaths) {
    if (require('fs').existsSync(testPath)) {
      iconPath = testPath;
      console.log('Found tray icon at:', iconPath);
      break;
    }
  }
  
  try {
    if (iconPath) {
      trayIcon = nativeImage.createFromPath(iconPath);
      if (trayIcon.isEmpty()) {
        throw new Error('Icon file is empty');
      }
    } else {
      throw new Error('No icon file found');
    }
  } catch (error) {
    console.log('Using fallback icon data URL');
    // Use fallback data URL icon
    trayIcon = nativeImage.createFromDataURL(iconDataURL);
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('Tasky - Your Reminder Assistant');
  
  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📋 Open Settings',
      click: () => showSettingsWindow()
    },
    {
      label: '🔔 Notifications',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        // Toggle notifications
        if (scheduler) {
          scheduler.toggleNotifications(menuItem.checked);
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '🔄 Test Notification',
      click: () => {
        if (scheduler) {
          scheduler.testNotification();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '❌ Exit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Handle double-click to open settings
  tray.on('double-click', () => {
    showSettingsWindow();
  });
};

// Function to show settings window
const showSettingsWindow = () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
};

// Cleanup when app is about to quit
app.on('before-quit', () => {
  if (scheduler) {
    scheduler.destroy();
  }
  if (assistant) {
    assistant.destroy();
  }
  // Custom notifications removed - Clippy handles all notifications
});

// IPC handlers for renderer communication
ipcMain.handle('get-reminders', () => {
  return store ? store.getReminders() : [];
});

ipcMain.on('add-reminder', (event, reminder) => {
  if (store && scheduler) {
    store.addReminder(reminder);
    scheduler.scheduleReminder(reminder);
  }
});

ipcMain.on('remove-reminder', (event, id) => {
  if (store && scheduler) {
    store.removeReminder(id);
    scheduler.removeReminder(id);
  }
});

ipcMain.on('update-reminder', (event, id, reminder) => {
  if (store && scheduler) {
    store.updateReminder(id, reminder);
    scheduler.updateReminder(id, reminder);
  }
});

ipcMain.handle('get-setting', (event, key) => {
  return store ? store.getSetting(key) : undefined;
});

ipcMain.on('set-setting', (event, key, value) => {
  if (store) {
    store.setSetting(key, value);
    
    // Apply setting changes to scheduler
    if (scheduler) {
      switch (key) {
        case 'enableNotifications':
          scheduler.toggleNotifications(value);
          break;
        case 'enableSound':
          scheduler.toggleSound(value);
          break;
        case 'enableAssistant':
          if (value && assistant) {
            console.log('Enabling desktop companion');
            assistant.show();
            setTimeout(() => {
              assistant.speak("I'm back! Ready to help with your reminders! 😊");
            }, 1000);
          } else if (assistant) {
            console.log('Disabling desktop companion');
            assistant.destroy();
          }
          break;
        case 'autoStart':
          app.setLoginItemSettings({
            openAtLogin: value,
            openAsHidden: value,
            name: 'Tasky',
            args: value ? ['--hidden'] : []
          });
          break;
        case 'notificationType':
          if (scheduler) {
            scheduler.setNotificationType(value);
          }
          break;
        case 'selectedAvatar':
          console.log('Avatar setting changed to:', value);
          // Avatar change is handled by the change-avatar IPC call
          break;
        case 'enableAnimation':
          console.log('Animation setting changed to:', value);
          if (assistant && assistant.window) {
            assistant.window.webContents.send('toggle-animation', value);
          }
          break;
      }
    }
  }
});

ipcMain.on('toggle-reminders', (event, enabled) => {
  if (scheduler) {
    scheduler.toggleNotifications(enabled);
  }
  if (store) {
    store.setSetting('enableNotifications', enabled);
  }
});

ipcMain.on('test-notification', () => {
  if (scheduler) {
    scheduler.testNotification();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('show-assistant', (event, message) => {
  if (assistant) {
    assistant.speak(message);
  }
});

ipcMain.on('hide-assistant', () => {
  if (assistant) {
    assistant.hide();
  }
});

ipcMain.on('set-bubble-side', (event, side) => {
  console.log('Setting Clippy bubble side to:', side);
  if (assistant) {
    assistant.setBubbleSide(side);
  }
});

ipcMain.on('change-avatar', (event, avatar) => {
  console.log('Changing avatar to:', avatar);
  if (assistant) {
    // Simply change the avatar without destroying the assistant
    assistant.setAvatar(avatar);
    
    // Send a message from the new avatar
    setTimeout(() => {
      assistant.speak(`Hi! I'm your new ${avatar} companion! 🎉`);
    }, 500);
  }
});

ipcMain.on('get-upcoming-notifications', (event) => {
  console.log('Getting upcoming notifications...');
  if (store) {
    const reminders = store.getReminders();
    const enabledReminders = reminders.filter(r => r.enabled);
    
    if (assistant && assistant.window) {
      assistant.window.webContents.send('upcoming-notifications-response', enabledReminders);
    }
  }
});

// Export for use in other modules
module.exports = { showSettingsWindow };
