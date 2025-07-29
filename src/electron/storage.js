const Store = require('electron-store');

class TaskyStore {
  constructor() {
    // Initialize electron-store with schema and defaults
    this.store = new Store({
      name: 'tasky-config',
      defaults: {
        reminders: [],
        settings: {
          enableNotifications: true,
          enableSound: true,
          enableAssistant: true,
          autoStart: false,
          notificationType: 'custom', // 'native', 'custom', or 'both'
          selectedAvatar: 'Clippy', // Avatar character selection
          darkMode: false, // Dark theme toggle
          enableAnimation: true, // Assistant bounce animation toggle
        },
        version: '1.0.0'
      },
      schema: {
        reminders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              message: { type: 'string', maxLength: 200 },
              time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
              days: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                }
              },
              enabled: { type: 'boolean' }
            },
            required: ['id', 'message', 'time', 'days', 'enabled']
          }
        },
        settings: {
          type: 'object',
          properties: {
            enableNotifications: { type: 'boolean' },
            enableSound: { type: 'boolean' },
            enableAssistant: { type: 'boolean' },
            autoStart: { type: 'boolean' },
            notificationType: { type: 'string', enum: ['native', 'custom', 'both'] },
            selectedAvatar: { type: 'string', enum: ['Clippy', 'Merlin', 'Rover', 'Genie', 'Rocky', 'Bonzi', 'Peedy', 'Links'] },
            darkMode: { type: 'boolean' }
          }
        },
        version: { type: 'string' }
      }
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