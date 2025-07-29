const cron = require('node-cron');
const { Notification } = require('electron');
const sound = require('sound-play');
const path = require('path');
const { spawn } = require('child_process');

class ReminderScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.notificationsEnabled = true;
    this.soundEnabled = true;
    this.notificationType = 'custom'; // 'native', 'custom', or 'both'
  }

  // Convert days array to cron pattern
  daysToCronPattern(days, time) {
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };

    const [hours, minutes] = time.split(':');
    const cronDays = days.map(day => dayMap[day.toLowerCase()]).sort().join(',');
    
    // Cron pattern: minute hour * * day-of-week
    return `${minutes} ${hours} * * ${cronDays}`;
  }

  // Schedule a new reminder
  scheduleReminder(reminder) {
    const { id, message, time, days, enabled } = reminder;
    
    if (!enabled || !this.notificationsEnabled) {
      return;
    }

    // Remove existing task if it exists
    this.removeReminder(id);

    try {
      const cronPattern = this.daysToCronPattern(days, time);
      console.log(`Scheduling reminder ${id} with pattern: ${cronPattern}`);
      
      const task = cron.schedule(cronPattern, () => {
        this.triggerReminder(reminder);
      }, {
        scheduled: true,
        timezone: 'America/New_York' // You can make this configurable
      });

      this.scheduledTasks.set(id, task);
      console.log(`Reminder ${id} scheduled successfully`);
    } catch (error) {
      console.error(`Failed to schedule reminder ${id}:`, error);
    }
  }

  // Remove a scheduled reminder
  removeReminder(id) {
    const task = this.scheduledTasks.get(id);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(id);
      console.log(`Reminder ${id} removed`);
    }
  }

  // Update an existing reminder
  updateReminder(id, reminder) {
    this.removeReminder(id);
    this.scheduleReminder(reminder);
  }

  // Toggle all notifications on/off
  toggleNotifications(enabled) {
    this.notificationsEnabled = enabled;
    console.log(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Toggle sound on/off
  toggleSound(enabled) {
    this.soundEnabled = enabled;
    console.log(`Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Set notification type (legacy - now only used for Clippy bubble side)
  setNotificationType(type) {
    // Convert old notification types to bubble sides
    if (type === 'native') {
      this.bubbleSide = 'right';
    } else {
      this.bubbleSide = 'left';
    }
    console.log(`Clippy bubble side set to: ${this.bubbleSide}`);
    
    // Update Clippy bubble side
    if (global.assistant) {
      global.assistant.setBubbleSide(this.bubbleSide);
    }
  }

  // Get all active reminders
  getActiveReminders() {
    return Array.from(this.scheduledTasks.keys());
  }

  // Trigger a reminder (show notification, play sound, etc.)
  triggerReminder(reminder) {
    console.log('Triggering reminder:', reminder.message);
    console.log('Using Clippy for all notifications');
    
    // Play sound if enabled
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
    
    // Emit event for other components
    if (global.mainWindow && global.mainWindow.webContents) {
      global.mainWindow.webContents.send('reminder-triggered', reminder);
    }
    
    // Show assistant delivery if available (always show for notifications)
    if (global.assistant) {
      console.log('Clippy delivering reminder notification:', reminder.message);
      // Always show Clippy for notification delivery, regardless of notification type
      global.assistant.speak(reminder.message);
    } else {
      console.log('Clippy desktop companion not available');
    }
  }

  // Show native system notification
  showNotification(reminder) {
    try {
      const notification = new Notification({
        title: '📋 Tasky Reminder',
        body: reminder.message,
        urgency: 'normal',
        timeoutType: 'default',
        actions: [
          {
            type: 'button',
            text: 'Dismiss'
          }
        ]
      });

      notification.show();
      
      notification.on('click', () => {
        console.log('Notification clicked');
        // You can add custom click behavior here
      });

      notification.on('action', (event, index) => {
        console.log('Notification action:', index);
      });

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Play notification sound
  playNotificationSound() {
    if (!this.soundEnabled) {
      console.log('Sound is disabled, skipping');
      return;
    }

    console.log('=== PLAYING NOTIFICATION SOUND ===');
    
    try {
      const fs = require('fs');
      
      // Try multiple possible paths for the notification.mp3 file
      const possiblePaths = [
        path.join(__dirname, '../assets/notification.mp3'),
        path.join(__dirname, '../../src/assets/notification.mp3'),
        path.join(process.cwd(), 'src/assets/notification.mp3'),
        path.join(__dirname, '../../assets/notification.mp3')
      ];
      
      let customSoundPath = null;
      console.log('Searching for notification.mp3 file...');
      
      for (const testPath of possiblePaths) {
        console.log('Checking path:', testPath);
        if (fs.existsSync(testPath)) {
          customSoundPath = testPath;
          console.log('✓ Found notification sound at:', customSoundPath);
          break;
        } else {
          console.log('✗ Not found at:', testPath);
        }
      }
      
      if (customSoundPath) {
        console.log('Attempting to play sound file:', customSoundPath);
        
        // Try sound-play library first
        sound.play(customSoundPath)
          .then(() => {
            console.log('✓ Sound played successfully with sound-play');
          })
          .catch((soundError) => {
            console.error('sound-play failed:', soundError);
            console.log('Trying Windows Media Player fallback...');
            
            // Fallback to Windows Media Player
            if (process.platform === 'win32') {
              spawn('powershell', [
                '-c', 
                `Add-Type -AssemblyName presentationCore; $mediaPlayer = New-Object system.windows.media.mediaplayer; $mediaPlayer.open('${customSoundPath.replace(/\\/g, '\\\\')}'); $mediaPlayer.play();`
              ], { windowsHide: true })
                .on('close', (code) => {
                  if (code === 0) {
                    console.log('✓ Sound played with PowerShell MediaPlayer');
                  } else {
                    console.error('PowerShell MediaPlayer failed with code:', code);
                    this.playSystemSound();
                  }
                });
            } else {
              console.log('Non-Windows platform, using system sound');
              this.playSystemSound();
            }
          });
      } else {
        console.warn('No notification.mp3 file found, using system sound');
        this.playSystemSound();
      }
    } catch (error) {
      console.error('Exception in playNotificationSound:', error);
      this.playSystemSound();
    }
  }
  
  // Fallback system sound method
  playSystemSound() {
    console.log('Playing system notification sound as fallback');
    try {
      if (process.platform === 'win32') {
        // Use Windows built-in notification sound
        spawn('powershell', ['-c', '(New-Object Media.SoundPlayer "C:\\Windows\\Media\\Windows Notify System Generic.wav").PlaySync();'], { 
          windowsHide: true 
        })
        .on('close', (code) => {
          console.log(code === 0 ? '✓ System sound played' : '✗ System sound failed');
        });
      } else {
        // For other platforms, try system bell
        console.log('Using ASCII bell for non-Windows platform');
        process.stdout.write('\u0007'); // ASCII bell character
      }
    } catch (error) {
      console.error('Failed to play system sound:', error);
    }
  }

  // Test notification
  testNotification() {
    const testReminder = {
      id: 'test',
      message: 'This is a test notification from Tasky! 🎉',
      time: new Date().toTimeString().slice(0, 5),
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    };
    
    console.log('=== TEST NOTIFICATION ===');
    console.log('Current notification type setting:', this.notificationType);
    console.log('Triggering test notification...');
    this.triggerReminder(testReminder);
    console.log('=== END TEST ===');
  }

  // Load and schedule multiple reminders
  loadReminders(reminders) {
    console.log(`Loading ${reminders.length} reminders`);
    
    // Clear existing tasks
    this.scheduledTasks.forEach((task, id) => {
      task.stop();
    });
    this.scheduledTasks.clear();

    // Schedule new reminders
    reminders.forEach(reminder => {
      if (reminder.enabled) {
        this.scheduleReminder(reminder);
      }
    });
  }

  // Get next scheduled time for a reminder (for UI display)
  getNextScheduledTime(reminder) {
    try {
      const cronPattern = this.daysToCronPattern(reminder.days, reminder.time);
      const task = cron.schedule(cronPattern, () => {}, { scheduled: false });
      
      // This is a simplified version - you'd need a more sophisticated
      // library like node-cron-tz to get actual next execution times
      return `Next: ${reminder.time} on ${reminder.days.join(', ')}`;
    } catch (error) {
      return 'Invalid schedule';
    }
  }

  // Clean up all scheduled tasks
  destroy() {
    console.log('Destroying scheduler...');
    this.scheduledTasks.forEach((task, id) => {
      task.stop();
    });
    this.scheduledTasks.clear();
  }
}

module.exports = ReminderScheduler;