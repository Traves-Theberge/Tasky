"use strict";
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const ReminderScheduler = require(path.join(process.cwd(), "src", "electron", "scheduler"));
const TaskyStore = require(path.join(process.cwd(), "src", "electron", "storage"));
const ClippyAssistant = require(path.join(process.cwd(), "src", "electron", "assistant"));
if (require("electron-squirrel-startup")) {
  app.quit();
}
if (process.platform === "win32") {
  app.setAppUserModelId("com.tasky.reminderapp");
}
let mainWindow;
let tray = null;
let scheduler = null;
let store = null;
let assistant = null;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
    minWidth: 450,
    maxWidth: 450,
    minHeight: 650,
    maxHeight: 650,
    resizable: false,
    // Disable window resizing
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, "../assets/app-icon.png"),
    show: false,
    // Don't show initially as this is a tray app
    skipTaskbar: true,
    frame: false,
    // Remove the entire window frame
    titleBarStyle: "hidden",
    autoHideMenuBar: true
    // Hide the menu bar
  });
  mainWindow.setMenuBarVisibility(false);
  {
    mainWindow.loadURL("http://localhost:3000");
  }
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};
app.whenReady().then(() => {
  store = new TaskyStore();
  store.migrate();
  scheduler = new ReminderScheduler();
  const savedReminders = store.getReminders();
  const settings = store.getAllSettings();
  assistant = new ClippyAssistant();
  const savedAvatar = settings.selectedAvatar || "Clippy";
  assistant.setAvatar(savedAvatar);
  const enableAnimation = settings.enableAnimation !== void 0 ? settings.enableAnimation : true;
  setTimeout(() => {
    if (assistant && assistant.window) {
      assistant.window.webContents.send("toggle-animation", enableAnimation);
    }
  }, 3e3);
  scheduler.toggleNotifications(settings.enableNotifications);
  scheduler.toggleSound(settings.enableSound);
  scheduler.setNotificationType(settings.notificationType || "custom");
  if (settings.autoStart) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      name: "Tasky",
      args: ["--hidden"]
    });
  }
  scheduler.loadReminders(savedReminders);
  if (settings.enableAssistant) {
    setTimeout(() => {
      console.log("Starting Clippy desktop companion...");
      console.log("Assistant available:", !!assistant);
      try {
        if (assistant) {
          console.log("Creating persistent desktop companion");
          assistant.show();
          setTimeout(() => {
            console.log("Sending welcome message to Clippy");
            assistant.speak("Hello! I'm your Tasky companion! I'll be here to deliver your reminders. 📋✨");
          }, 3e3);
        } else {
          console.error("Assistant instance is null!");
        }
      } catch (error) {
        console.error("Error starting desktop companion:", error);
      }
    }, 2e3);
  } else {
    console.log("Desktop companion disabled in settings");
  }
  createWindow();
  createTray();
  if (process.argv.includes("--hidden")) {
    if (mainWindow) {
      mainWindow.hide();
    }
  }
  global.mainWindow = mainWindow;
  global.assistant = assistant;
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", (e) => {
  e.preventDefault();
});
const createTray = () => {
  const iconDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGESURBVDiNpZM7SwNBFIWfgwQLwcJCG1sLwcJCG1sLG0uxsLG0sLGwsLGwsLBQsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsA==";
  let trayIcon;
  const possiblePaths = [
    path.join(__dirname, "../assets/tray-icon.png"),
    path.join(__dirname, "../../src/assets/tray-icon.png"),
    path.join(process.cwd(), "src/assets/tray-icon.png")
  ];
  let iconPath = null;
  for (const testPath of possiblePaths) {
    if (require("fs").existsSync(testPath)) {
      iconPath = testPath;
      console.log("Found tray icon at:", iconPath);
      break;
    }
  }
  try {
    if (iconPath) {
      trayIcon = nativeImage.createFromPath(iconPath);
      if (trayIcon.isEmpty()) {
        throw new Error("Icon file is empty");
      }
    } else {
      throw new Error("No icon file found");
    }
  } catch (error) {
    console.log("Using fallback icon data URL");
    trayIcon = nativeImage.createFromDataURL(iconDataURL);
  }
  tray = new Tray(trayIcon);
  tray.setToolTip("Tasky - Your Reminder Assistant");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "📋 Open Settings",
      click: () => showSettingsWindow()
    },
    {
      label: "🔔 Notifications",
      type: "checkbox",
      checked: true,
      click: (menuItem) => {
        if (scheduler) {
          scheduler.toggleNotifications(menuItem.checked);
        }
      }
    },
    {
      type: "separator"
    },
    {
      label: "🔄 Test Notification",
      click: () => {
        if (scheduler) {
          scheduler.testNotification();
        }
      }
    },
    {
      type: "separator"
    },
    {
      label: "❌ Exit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    showSettingsWindow();
  });
};
const showSettingsWindow = () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
};
app.on("before-quit", () => {
  if (scheduler) {
    scheduler.destroy();
  }
  if (assistant) {
    assistant.destroy();
  }
});
ipcMain.handle("get-reminders", () => {
  return store ? store.getReminders() : [];
});
ipcMain.on("add-reminder", (event, reminder) => {
  if (store && scheduler) {
    store.addReminder(reminder);
    scheduler.scheduleReminder(reminder);
  }
});
ipcMain.on("remove-reminder", (event, id) => {
  if (store && scheduler) {
    store.removeReminder(id);
    scheduler.removeReminder(id);
  }
});
ipcMain.on("update-reminder", (event, id, reminder) => {
  if (store && scheduler) {
    store.updateReminder(id, reminder);
    scheduler.updateReminder(id, reminder);
  }
});
ipcMain.handle("get-setting", (event, key) => {
  return store ? store.getSetting(key) : void 0;
});
ipcMain.on("set-setting", (event, key, value) => {
  if (store) {
    store.setSetting(key, value);
    if (scheduler) {
      switch (key) {
        case "enableNotifications":
          scheduler.toggleNotifications(value);
          break;
        case "enableSound":
          scheduler.toggleSound(value);
          break;
        case "enableAssistant":
          if (value && assistant) {
            console.log("Enabling desktop companion");
            assistant.show();
            setTimeout(() => {
              assistant.speak("I'm back! Ready to help with your reminders! 😊");
            }, 1e3);
          } else if (assistant) {
            console.log("Disabling desktop companion");
            assistant.destroy();
          }
          break;
        case "autoStart":
          app.setLoginItemSettings({
            openAtLogin: value,
            openAsHidden: value,
            name: "Tasky",
            args: value ? ["--hidden"] : []
          });
          break;
        case "notificationType":
          if (scheduler) {
            scheduler.setNotificationType(value);
          }
          break;
        case "selectedAvatar":
          console.log("Avatar setting changed to:", value);
          break;
        case "enableAnimation":
          console.log("Animation setting changed to:", value);
          if (assistant && assistant.window) {
            assistant.window.webContents.send("toggle-animation", value);
          }
          break;
      }
    }
  }
});
ipcMain.on("toggle-reminders", (event, enabled) => {
  if (scheduler) {
    scheduler.toggleNotifications(enabled);
  }
  if (store) {
    store.setSetting("enableNotifications", enabled);
  }
});
ipcMain.on("test-notification", () => {
  if (scheduler) {
    scheduler.testNotification();
  }
});
ipcMain.on("close-window", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});
ipcMain.on("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
ipcMain.on("show-assistant", (event, message) => {
  if (assistant) {
    assistant.speak(message);
  }
});
ipcMain.on("hide-assistant", () => {
  if (assistant) {
    assistant.hide();
  }
});
ipcMain.on("set-bubble-side", (event, side) => {
  console.log("Setting Clippy bubble side to:", side);
  if (assistant) {
    assistant.setBubbleSide(side);
  }
});
ipcMain.on("change-avatar", (event, avatar) => {
  console.log("Changing avatar to:", avatar);
  if (assistant) {
    assistant.setAvatar(avatar);
    setTimeout(() => {
      assistant.speak(`Hi! I'm your new ${avatar} companion! 🎉`);
    }, 500);
  }
});
ipcMain.on("get-upcoming-notifications", (event) => {
  console.log("Getting upcoming notifications...");
  if (store) {
    const reminders = store.getReminders();
    const enabledReminders = reminders.filter((r) => r.enabled);
    if (assistant && assistant.window) {
      assistant.window.webContents.send("upcoming-notifications-response", enabledReminders);
    }
  }
});
module.exports = { showSettingsWindow };
