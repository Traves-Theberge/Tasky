const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const ReminderScheduler = require(path.join(process.cwd(), 'src', 'electron', 'scheduler'));
const TaskyStore = require(path.join(process.cwd(), 'src', 'electron', 'storage'));
const ClippyAssistant = require(path.join(process.cwd(), 'src', 'electron', 'assistant'));

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
    minimizable: true, // Ensure window can be minimized
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    show: false, // Don't show initially as this is a tray app
    skipTaskbar: false, // Show in taskbar when minimized
    alwaysOnTop: false, // Don't stay on top so it can be minimized properly
    frame: false, // Remove the entire window frame
    titleBarStyle: 'hidden',
    movable: true, // Enable window dragging
    autoHideMenuBar: true, // Hide the menu bar
  });

  // Remove the menu bar completely
  mainWindow.setMenuBarVisibility(false);
  
  // Force window to show in taskbar even when frameless
  mainWindow.setSkipTaskbar(false);

  // and load the index.html of the app.
  // These constants are injected by Electron Forge Vite plugin
  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererName = typeof MAIN_WINDOW_VITE_NAME !== 'undefined' ? MAIN_WINDOW_VITE_NAME : 'main_window';
    const indexPath = path.join(__dirname, `../renderer/${rendererName}/index.html`);
    console.log('Loading renderer from:', indexPath);
    mainWindow.loadFile(indexPath);
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
  // Request notification permissions for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.tasky.reminderapp');
    
    // Check and request notification permissions
    const { Notification } = require('electron');
    console.log('Notification support:', Notification.isSupported());
    console.log('Requesting notification permissions...');
  }
  
  // Initialize storage
  store = new TaskyStore();
  store.migrate(); // Run any necessary migrations
  
  // Initialize scheduler
  scheduler = new ReminderScheduler();
  
  // Load saved reminders and settings
  const savedReminders = store.getReminders();
  const settings = store.getAllSettings();
  
  // Initialize Clippy assistant with saved avatar
  assistant = new ClippyAssistant();
  const savedAvatar = settings.selectedAvatar || 'Clippy';
  assistant.setAvatar(savedAvatar);
  
  // If it's a custom avatar, set the custom path
  if (savedAvatar === 'Custom' || savedAvatar.startsWith('custom_')) {
    const customPath = settings.customAvatarPath;
    if (customPath) {
      setTimeout(() => {
        if (assistant && assistant.window) {
          assistant.setCustomAvatarPath(customPath);
        }
      }, 3000);
    }
  }
  
  // Apply dragging setting
  const enableDragging = settings.enableDragging !== undefined ? settings.enableDragging : true;
  assistant.setDraggingMode(enableDragging);
  
  // Apply bubble side setting
  const bubbleSide = settings.bubbleSide || 'left';
  assistant.setBubbleSide(bubbleSide);
  
  // Apply layer setting - defer until window is created
  const assistantLayer = settings.assistantLayer || 'above';
  
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
      try {
        if (assistant) {
          assistant.show();
          
          setTimeout(() => {
            assistant.setLayer(assistantLayer);
          }, 1000);
          
          setTimeout(() => {
            assistant.speak("Hello! I'm your Tasky companion! I'll be here to deliver your reminders. 📋✨");
          }, 3000);
        }
      } catch (error) {
        console.error('Error starting desktop companion:', error);
      }
    }, 2000); // Increased delay to ensure everything is loaded
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
            if (!assistant.isVisible) {
              assistant.show();
              setTimeout(() => {
                assistant.speak("I'm back! Ready to help with your reminders! 😊");
              }, 1000);
            }
          } else if (assistant && assistant.window) {
            assistant.window.hide();
            assistant.isVisible = false;
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
          // Avatar change is handled by the change-avatar IPC call
          break;
        case 'enableAnimation':
          if (assistant && assistant.window) {
            assistant.window.webContents.send('toggle-animation', value);
          }
          break;
        case 'assistantLayer':
          if (assistant) {
            assistant.setLayer(value);
          }
          break;
        case 'enableDragging':
          if (assistant) {
            assistant.setDraggingMode(value);
          }
          break;
        case 'bubbleSide':
          if (assistant) {
            assistant.setBubbleSide(value);
          }
          break;
      }
    }
  }
});

ipcMain.on('toggle-reminders', (event, enabled) => {
  console.log('Toggle reminders called with:', enabled);
  if (scheduler) {
    scheduler.toggleNotifications(enabled);
    console.log('Scheduler notifications set to:', enabled);
  }
  if (store) {
    store.setSetting('enableNotifications', enabled);
    console.log('Settings saved: enableNotifications =', enabled);
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
    try {
      mainWindow.setSkipTaskbar(false);
      mainWindow.minimize();
    } catch (error) {
      console.error('Minimize failed:', error);
    }
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
  console.log('Set bubble side called with:', side);
  if (assistant) {
    assistant.setBubbleSide(side);
    console.log('Assistant bubble side set to:', side);
  }
  if (store) {
    store.setSetting('bubbleSide', side);
    console.log('Settings saved: bubbleSide =', side);
  }
});

ipcMain.on('change-avatar', (event, avatar) => {
  if (assistant) {
    // Simply change the avatar without destroying the assistant
    assistant.setAvatar(avatar);
    
    // If it's a custom avatar, also send the path immediately
    if (avatar === 'Custom' || avatar.startsWith('custom_')) {
      const customPath = store.getSetting('customAvatarPath');
      if (customPath) {
        setTimeout(() => {
          if (assistant && assistant.window) {
            assistant.setCustomAvatarPath(customPath);
          }
        }, 1000);
      }
    }
    
    // Send a message from the new avatar
    setTimeout(() => {
      if (avatar === 'Custom' || avatar.startsWith('custom_')) {
        assistant.speak(`Hi! I'm your custom companion! ✨`);
      } else {
        assistant.speak(`Hi! I'm your new ${avatar} companion! 🎉`);
      }
    }, 500);
  }
});

ipcMain.on('toggle-assistant-dragging', (event, enabled) => {
  if (assistant) {
    assistant.setDraggingMode(enabled);
  }
});

ipcMain.on('set-assistant-layer', (event, layer) => {
  if (assistant) {
    assistant.setLayer(layer);
  }
});

ipcMain.handle('select-avatar-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Avatar Image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];
  
  // Test if file exists
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    console.log('✅ File exists and is accessible');
  } else {
    console.error('❌ File does not exist or is not accessible');
  }

  return filePath;
});

ipcMain.handle('get-avatar-data-url', async (event, filePath) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }
    
    const imageBuffer = fs.readFileSync(filePath);
    const extname = path.extname(filePath).toLowerCase();
    
    // Determine MIME type
    let mimeType = 'image/png'; // default
    switch (extname) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.bmp':
        mimeType = 'image/bmp';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
    }
    
    const base64Image = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error reading avatar file:', error);
    return null;
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
