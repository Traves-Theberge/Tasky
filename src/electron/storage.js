const Store = require('electron-store');

class TaskyStore {
  constructor() {
    // Initialize electron-store with minimal schema to avoid validation issues
    this.store = new Store({
      name: 'tasky-config-v2', // New name to avoid cached schema issues
      defaults: {
        reminders: [],
        settings: {
          enableNotifications: true,
          enableSound: true,
          enableAssistant: true,
          autoStart: false,
          notificationType: 'custom',
          selectedAvatar: 'Clippy',
          darkMode: false,
          enableAnimation: true,
          timeFormat: '24',
          enableDragging: true,
          assistantLayer: 'above',
          customAvatarPath: '',
          customAvatars: []
        },
        version: '2.0.0'
      }
      // Removed schema validation to avoid conflicts with custom avatars
    });

    console.log('TaskyStore initialized, config file:', this.store.path);
  }

  // Reminder management methods
  getReminders() {
    try {
      const reminders = this.store.get('reminders', []);
      console.log(`Loaded ${reminders.length} reminders from storage`);
      return reminders;
    } catch (error) {
      console.error('Failed to get reminders:', error);
      return [];
    }
  }

  addReminder(reminder) {
    try {
      const reminders = this.getReminders();
      
      // Check if reminder with this ID already exists
      const existingIndex = reminders.findIndex(r => r.id === reminder.id);
      if (existingIndex !== -1) {
        console.warn(`Reminder with ID ${reminder.id} already exists, updating instead`);
        return this.updateReminder(reminder.id, reminder);
      }

      reminders.push(reminder);
      this.store.set('reminders', reminders);
      console.log(`Added reminder: ${reminder.id}`);
      return true;
    } catch (error) {
      console.error('Failed to add reminder:', error);
      return false;
    }
  }

  updateReminder(id, updatedReminder) {
    try {
      const reminders = this.getReminders();
      const index = reminders.findIndex(r => r.id === id);
      
      if (index === -1) {
        console.warn(`Reminder with ID ${id} not found for update`);
        return false;
      }

      reminders[index] = { ...reminders[index], ...updatedReminder, id }; // Preserve ID
      this.store.set('reminders', reminders);
      console.log(`Updated reminder: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      return false;
    }
  }

  removeReminder(id) {
    try {
      const reminders = this.getReminders();
      const filteredReminders = reminders.filter(r => r.id !== id);
      
      if (filteredReminders.length === reminders.length) {
        console.warn(`Reminder with ID ${id} not found for removal`);
        return false;
      }

      this.store.set('reminders', filteredReminders);
      console.log(`Removed reminder: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to remove reminder:', error);
      return false;
    }
  }

  // Settings management methods
  getSetting(key) {
    try {
      const value = this.store.get(`settings.${key}`);
      console.log(`Got setting ${key}:`, value);
      return value;
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return undefined;
    }
  }

  setSetting(key, value) {
    try {
      this.store.set(`settings.${key}`, value);
      console.log(`Set setting ${key}:`, value);
      return true;
    } catch (error) {
      console.error(`Failed to set setting ${key}:`, error);
      return false;
    }
  }

  getAllSettings() {
    try {
      const settings = this.store.get('settings', {});
      console.log('Got all settings:', settings);
      return settings;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  updateSettings(newSettings) {
    try {
      const currentSettings = this.getAllSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      this.store.set('settings', updatedSettings);
      console.log('Updated settings:', updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  }

  // Utility methods
  clearAll() {
    try {
      this.store.clear();
      console.log('Cleared all stored data');
      return true;
    } catch (error) {
      console.error('Failed to clear stored data:', error);
      return false;
    }
  }

  getStorePath() {
    return this.store.path;
  }

  getStoreSize() {
    return this.store.size;
  }

  // Export/Import functionality
  exportData() {
    try {
      const data = {
        reminders: this.getReminders(),
        settings: this.getAllSettings(),
        exportDate: new Date().toISOString(),
        version: this.store.get('version')
      };
      console.log('Exported data');
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  importData(data) {
    try {
      if (data.reminders) {
        this.store.set('reminders', data.reminders);
      }
      if (data.settings) {
        this.store.set('settings', data.settings);
      }
      console.log('Imported data successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Migration support for future versions
  migrate() {
    const currentVersion = this.store.get('version', '1.0.0');
    console.log(`Current storage version: ${currentVersion}`);
    
    // Add migration logic here when needed
    // For example:
    // if (currentVersion === '1.0.0') {
    //   // Migrate to 1.1.0
    //   this.store.set('version', '1.1.0');
    // }
  }
}

module.exports = TaskyStore;