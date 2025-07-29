const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Reminder management
  addReminder: (reminder) => ipcRenderer.send('add-reminder', reminder),
  removeReminder: (id) => ipcRenderer.send('remove-reminder', id),
  updateReminder: (id, reminder) => ipcRenderer.send('update-reminder', id, reminder),
  getReminders: () => ipcRenderer.invoke('get-reminders'),
  
  // Settings management
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.send('set-setting', key, value),
  
  // Notification controls
  testNotification: () => ipcRenderer.send('test-notification'),
  toggleReminders: (enabled) => ipcRenderer.send('toggle-reminders', enabled),
  
  // Assistant controls
  showAssistant: (message) => ipcRenderer.send('show-assistant', message),
  hideAssistant: () => ipcRenderer.send('hide-assistant'),
  changeAvatar: (avatar) => ipcRenderer.send('change-avatar', avatar),
  setBubbleSide: (side) => ipcRenderer.send('set-bubble-side', side),
  
  // Window controls
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  
  // Listen for events from main process
  onReminderNotification: (callback) => ipcRenderer.on('reminder-notification', callback),
  onAssistantMessage: (callback) => ipcRenderer.on('assistant-message', callback),
  onSettingsUpdate: (callback) => ipcRenderer.on('settings-update', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});