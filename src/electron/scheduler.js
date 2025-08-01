/**
 * ReminderScheduler - Handles scheduling and triggering of reminders
 * 
 * This class manages cron-based scheduling of reminders, handles notification
 * display, and plays notification sounds. It provides fallback mechanisms
 * for cross-platform compatibility.
 */

const cron = require('node-cron');
const { Notification, app } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

class ReminderScheduler {
  constructor() {
    this.scheduledTasks = new Map();    // Maps reminder IDs to cron tasks
    this.notificationsEnabled = true;   // Global notification toggle
    this.soundEnabled = true;           // Global sound toggle
    this.notificationType = 'custom';   // Legacy setting for compatibility
  }

  /**
   * Converts an array of day names and time into a cron pattern
   * @param {string[]} days - Array of day names (e.g., ['monday', 'tuesday'])
   * @param {string} time - Time in HH:MM format
   * @returns {string} Cron pattern string
   */
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`Scheduling reminder ${id} with pattern: ${cronPattern}`);
      }
      
      const task = cron.schedule(cronPattern, () => {
        this.triggerReminder(reminder);
      }, {
        scheduled: true,
        timezone: 'America/New_York' // You can make this configurable
      });

      this.scheduledTasks.set(id, task);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Reminder ${id} scheduled successfully`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to schedule reminder ${id}:`, error);
      }
    }
  }

  // Remove a scheduled reminder
  removeReminder(id) {
    const task = this.scheduledTasks.get(id);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(id);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Reminder ${id} removed`);
      }
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Toggle sound on/off
  toggleSound(enabled) {
    this.soundEnabled = enabled;
    if (process.env.NODE_ENV === 'development') {
      console.log(`Sound ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Set notification type (legacy - now only used for Clippy bubble side)
  setNotificationType(type) {
    // Convert old notification types to bubble sides
    if (type === 'native') {
      this.bubbleSide = 'right';
    } else {
      this.bubbleSide = 'left';
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`Clippy bubble side set to: ${this.bubbleSide}`);
    }
    
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Triggering reminder:', reminder.message);
    }
    
    if (!this.notificationsEnabled) {
      return;
    }
    
    // Play sound if enabled
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
    
    // Emit event for other components
    if (global.mainWindow && global.mainWindow.webContents) {
      global.mainWindow.webContents.send('reminder-triggered', reminder);
    }
    
    // Use Clippy for notifications if available, otherwise fall back to native notifications
    if (global.assistant && global.assistant.isVisible) {
      global.assistant.speak(reminder.message);
    } else {
      this.showNotification(reminder);
    }
    
  }

  // Show native system notification
  showNotification(reminder) {
    try {
      // Check if notifications are supported
      if (!Notification.isSupported()) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Native notifications are not supported on this system');
        }
        this.showFallbackNotification(reminder);
        return;
      }
      const notification = new Notification({
        title: '📋 Tasky Reminder',
        body: reminder.message,
        urgency: 'normal',
        timeoutType: 'default',
        silent: false,
        icon: path.join(__dirname, '../assets/app-icon.png')
      });

      notification.show();
      
      notification.on('click', () => {
        if (global.mainWindow) {
          global.mainWindow.show();
          global.mainWindow.focus();
        }
      });

      notification.on('failed', (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Notification failed:', error);
        }
        this.showFallbackNotification(reminder);
      });

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to show native notification:', error);
      }
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
    console.log('playNotificationSound called, soundEnabled:', this.soundEnabled);
    if (!this.soundEnabled) {
      console.log('Sound is disabled, skipping');
      return;
    }

    try {
      const fs = require('fs');
      
      // Try multiple possible paths for the notification.mp3 file
      const possiblePaths = [
        // Development paths
        path.join(__dirname, '../assets/notification.mp3'),
        path.join(__dirname, '../../src/assets/notification.mp3'),
        path.join(process.cwd(), 'src/assets/notification.mp3'),
        path.join(__dirname, '../../assets/notification.mp3'),
        // Packaged app paths
        path.join(process.resourcesPath, 'app.asar', 'src', 'assets', 'notification.mp3'),
        path.join(process.resourcesPath, 'src', 'assets', 'notification.mp3'),
        path.join(app.getAppPath(), 'src', 'assets', 'notification.mp3'),
        // Additional fallback paths for different packaging configurations
        path.join(process.resourcesPath, 'app', 'src', 'assets', 'notification.mp3'),
        path.join(__dirname, '..', '..', '..', 'src', 'assets', 'notification.mp3')
      ];
      
      let customSoundPath = null;
      
      console.log('Checking for notification.mp3 in paths...');
      for (const testPath of possiblePaths) {
        console.log('Testing path:', testPath);
        if (fs.existsSync(testPath)) {
          customSoundPath = testPath;
          console.log('✓ Found notification sound at:', customSoundPath);
          break;
        } else {
          console.log('✗ Path not found:', testPath);
        }
      }
      
      if (customSoundPath) {
        // Try multiple approaches for playing sound
        this.playSoundWithElectron(customSoundPath)
          .catch(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Electron audio failed, trying alternative method...');
            }
            return this.playSoundWithAudioContext(customSoundPath);
          })
          .catch(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('All audio methods failed, using system sound');
            }
            this.playSystemSound();
          });
      } else {
        this.playSystemSound();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Exception in playNotificationSound:', error);
      }
      this.playSystemSound();
    }
  }

  // Play sound using Electron's built-in capabilities
  playSoundWithElectron(soundPath) {
    return new Promise((resolve, reject) => {
    try {
      // Create a hidden browser window to play the sound
      const { BrowserWindow } = require('electron');
      
      const soundWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webSecurity: false // Allow file:// URLs to work properly
        }
      });

      // Convert Windows path to proper file URL
      let fileUrl;
      if (process.platform === 'win32') {
        // Handle Windows paths properly
        fileUrl = `file:///${soundPath.replace(/\\/g, '/').replace(/^([A-Z]):/, '$1:')}`;
      } else {
        fileUrl = `file://${soundPath}`;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Using audio file URL:', fileUrl);
      }
      
      // Load HTML with audio element
      const audioHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sound Player</title>
        </head>
        <body>
          <audio id="audio" preload="auto" autoplay>
            <source src="${fileUrl}" type="audio/mpeg">
            <source src="${fileUrl}" type="audio/mp3">
            <source src="${fileUrl}" type="audio/wav">
          </audio>
          <script>
            console.log('Audio script starting...');
            const audio = document.getElementById('audio');
            
            // Set volume
            audio.volume = 0.7;
            
            // Add event listeners
            audio.addEventListener('loadstart', () => console.log('Audio load started'));
            audio.addEventListener('canplay', () => console.log('Audio can play'));
            audio.addEventListener('canplaythrough', () => console.log('Audio can play through'));
            audio.addEventListener('playing', () => console.log('Audio is playing!'));
            audio.addEventListener('ended', () => {
              console.log('Audio ended');
              setTimeout(() => window.close(), 100);
            });
            audio.addEventListener('error', (e) => {
              console.error('Audio error:', e, audio.error);
              setTimeout(() => window.close(), 100);
            });
            
            // Try to play immediately
            console.log('Attempting to play audio...');
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Audio play() succeeded');
                  // Auto-close after audio duration + buffer
                  setTimeout(() => {
                    if (!soundWindow || !soundWindow.isDestroyed()) {
                      window.close();
                    }
                  }, 3000);
                  resolve();
                })
                .catch(error => {
                  console.error('Audio play() failed:', error);
                  reject(error);
                  window.close();
                });
            }
            
            // Emergency close after 8 seconds
            setTimeout(() => window.close(), 8000);
          </script>
        </body>
        </html>
      `;

      soundWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(audioHtml)}`);
      
      soundWindow.webContents.once('did-finish-load', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✓ Sound window loaded, attempting audio playback');
        }
      });

      soundWindow.on('closed', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Sound window closed');
        }
      });

      // Fallback: close window after 10 seconds and reject
      setTimeout(() => {
        if (soundWindow && !soundWindow.isDestroyed()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Force closing sound window after timeout');
          }
          soundWindow.close();
          reject(new Error('Audio playback timeout'));
        }
      }, 10000);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Electron sound playback failed:', error);
      }
      reject(error);
    }
    });
  }

  // Alternative sound method using AudioContext
  playSoundWithAudioContext(soundPath) {
    return new Promise((resolve, reject) => {
      try {
        const fs = require('fs');
        const { BrowserWindow } = require('electron');
        
        // Read the audio file
        const audioBuffer = fs.readFileSync(soundPath);
        const base64Audio = audioBuffer.toString('base64');
        
        const soundWindow = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
          }
        });

        const audioContextHtml = `
          <!DOCTYPE html>
          <html>
          <head><title>Audio Context Player</title></head>
          <body>
            <script>
              console.log('AudioContext method starting...');
              
              const audioData = 'data:audio/mpeg;base64,${base64Audio}';
              
              fetch(audioData)
                .then(response => response.arrayBuffer())
                .then(data => {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  return audioContext.decodeAudioData(data);
                })
                .then(audioBuffer => {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  
                  const gainNode = audioContext.createGain();
                  gainNode.gain.value = 0.7;
                  
                  source.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  
                  source.onended = () => {
                    console.log('AudioContext playback ended');
                    setTimeout(() => window.close(), 100);
                  };
                  
                  source.start();
                  console.log('AudioContext playback started');
                })
                .catch(error => {
                  console.error('AudioContext failed:', error);
                  setTimeout(() => window.close(), 100);
                });
              
              setTimeout(() => window.close(), 5000);
            </script>
          </body>
          </html>
        `;

        soundWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(audioContextHtml)}`);
        
        soundWindow.webContents.once('did-finish-load', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✓ AudioContext window loaded');
          }
          resolve();
        });

        soundWindow.on('closed', () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('AudioContext window closed');
          }
        });

        setTimeout(() => {
          if (soundWindow && !soundWindow.isDestroyed()) {
            soundWindow.close();
            reject(new Error('AudioContext timeout'));
          }
        }, 6000);

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('AudioContext method failed:', error);
        }
        reject(error);
      }
    });
  }
  
  // Fallback system sound method
  playSystemSound() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Playing system notification sound as fallback');
    }
    try {
      // Use Electron's shell.beep() if available, or create a simple beep sound
      const { shell } = require('electron');
      
      if (shell && typeof shell.beep === 'function') {
        shell.beep();
        if (process.env.NODE_ENV === 'development') {
          console.log('✓ Played system beep via Electron shell');
        }
        return;
      }

      // Alternative: Create a simple beep using Web Audio API in a hidden window
      const { BrowserWindow } = require('electron');
      
      const beepWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });

      const beepHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Beep</title></head>
        <body>
          <script>
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);
              
              setTimeout(() => window.close(), 1000);
            } catch (error) {
              console.error('Beep failed:', error);
              window.close();
            }
          </script>
        </body>
        </html>
      `;

      beepWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(beepHtml)}`);
      
      beepWindow.on('closed', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✓ System beep completed');
        }
      });

      // Fallback: close after 2 seconds
      setTimeout(() => {
        if (beepWindow && !beepWindow.isDestroyed()) {
          beepWindow.close();
        }
      }, 2000);

    } catch (error) {
      // Ultimate fallback - ASCII bell
      try {
        process.stdout.write('\u0007');
        if (process.env.NODE_ENV === 'development') {
          console.log('Used ASCII bell as ultimate fallback');
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Even ASCII bell failed:', e);
        }
      }
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`Loading ${reminders.length} reminders`);
    }
    
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Destroying scheduler...');
    }
    this.scheduledTasks.forEach((task, id) => {
      try {
        task.stop();
        task.destroy();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error stopping task ${id}:`, error);
        }
      }
    });
    this.scheduledTasks.clear();
    
    // Kill any lingering PowerShell processes on Windows
    if (process.platform === 'win32') {
      try {
        // Don't wait for this to complete, just fire and forget
        spawn('taskkill', ['/f', '/im', 'powershell.exe', '/fi', 'WINDOWTITLE eq Windows PowerShell'], { 
          windowsHide: true,
          detached: true,
          stdio: 'ignore'
        }).unref();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error cleaning up PowerShell processes:', error);
        }
      }
    }
  }
}

module.exports = ReminderScheduler;