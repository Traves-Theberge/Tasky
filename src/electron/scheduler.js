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
    console.log('Message:', reminder.message);
    console.log('Notifications enabled:', this.notificationsEnabled);
    
    if (!this.notificationsEnabled) {
      console.log('Notifications are disabled, skipping');
      return;
    }
    
    // Play sound if enabled
    if (this.soundEnabled) {
      console.log('Playing notification sound');
      this.playNotificationSound();
    }
    
    // Emit event for other components
    if (global.mainWindow && global.mainWindow.webContents) {
      console.log('Sending reminder-triggered event to main window');
      global.mainWindow.webContents.send('reminder-triggered', reminder);
    }
    
    // Use Clippy for notifications if available, otherwise fall back to native notifications
    if (global.assistant && global.assistant.isVisible) {
      console.log('Clippy delivering reminder notification:', reminder.message);
      global.assistant.speak(reminder.message);
    } else {
      console.log('Clippy not available, showing native notification');
      this.showNotification(reminder);
    }
    
  }

  // Show native system notification
  showNotification(reminder) {
    try {
      // Check if notifications are supported
      if (!Notification.isSupported()) {
        console.error('Native notifications are not supported on this system');
        this.showFallbackNotification(reminder);
        return;
      }

      console.log('Creating native notification...');
      const notification = new Notification({
        title: '📋 Tasky Reminder',
        body: reminder.message,
        urgency: 'normal',
        timeoutType: 'default',
        silent: false,
        icon: path.join(__dirname, '../assets/app-icon.png')
      });

      console.log('Showing notification...');
      notification.show();
      
      notification.on('click', () => {
        console.log('Notification clicked - bringing app to front');
        if (global.mainWindow) {
          global.mainWindow.show();
          global.mainWindow.focus();
        }
      });

      notification.on('close', () => {
        console.log('Notification closed');
      });

      notification.on('failed', (error) => {
        console.error('Notification failed:', error);
        this.showFallbackNotification(reminder);
      });

      console.log('✅ Native notification created successfully');

    } catch (error) {
      console.error('Failed to show native notification:', error);
      this.showFallbackNotification(reminder);
    }
  }

  // Fallback notification method using Windows toast or console  
  showFallbackNotification(reminder) {
    try {
      if (process.platform === 'win32') {
        console.log('Using Windows PowerShell BalloonTip as fallback');
        const escapedMessage = reminder.message.replace(/'/g, "''").replace(/"/g, '""');
        
        // Use Windows system tray balloon notification
        spawn('powershell', [
          '-WindowStyle', 'Hidden',
          '-Command',
          `Add-Type -AssemblyName System.Windows.Forms; $balloon = New-Object System.Windows.Forms.NotifyIcon; $balloon.Icon = [System.Drawing.SystemIcons]::Information; $balloon.BalloonTipTitle = '📋 Tasky Reminder'; $balloon.BalloonTipText = '${escapedMessage}'; $balloon.Visible = $true; $balloon.ShowBalloonTip(5000); Start-Sleep -Seconds 6; $balloon.Dispose();`
        ], { windowsHide: true })
        .on('close', (code) => {
          
          if (code !== 0) {
            // Try Windows 10/11 toast as secondary fallback
            spawn('powershell', [
              '-WindowStyle', 'Hidden', 
              '-Command',
              `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; try { $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $toastXml = [xml] $template.GetXml(); $toastXml.GetElementsByTagName("text")[0].AppendChild($toastXml.CreateTextNode("📋 Tasky Reminder")) > $null; $toastXml.GetElementsByTagName("text")[1].AppendChild($toastXml.CreateTextNode("${escapedMessage}")) > $null; $toast = [Windows.UI.Notifications.ToastNotification]::new($toastXml); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Tasky").Show($toast); } catch { Write-Host "Toast failed" }`
            ], { windowsHide: true })
            .on('close', (toastCode) => {
            });
          }
        });
      } else {
        console.log('Non-Windows platform, using console notification');
        console.log(`🔔 REMINDER: ${reminder.message}`);
      }
    } catch (error) {
      console.error('Fallback notification failed:', error);
      console.log(`🔔 EMERGENCY REMINDER: ${reminder.message}`);
    }
  }

  // Play notification sound
  playNotificationSound() {
    if (!this.soundEnabled) {
      console.log('Sound is disabled, skipping');
      return;
    }

    
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
    
    console.log('Notifications enabled:', this.notificationsEnabled);
    console.log('Sound enabled:', this.soundEnabled);
    console.log('Global assistant available:', !!global.assistant);
    console.log('Global mainWindow available:', !!global.mainWindow);
    console.log('Test reminder object:', testReminder);
    
    if (!this.notificationsEnabled) {
      console.log('⚠️ Test notification blocked - notifications are disabled in settings');
      return;
    }
    
    console.log('Calling triggerReminder with test data...');
    this.triggerReminder(testReminder);
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