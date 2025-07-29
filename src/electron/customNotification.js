const { BrowserWindow, screen } = require('electron');
const path = require('path');

class CustomNotificationWindow {
  constructor() {
    this.activeNotifications = new Map();
    this.notificationQueue = [];
    this.maxVisibleNotifications = 3;
    this.notificationHeight = 120;
    this.notificationWidth = 350;
    this.margin = 10;
  }

  createNotificationWindow(notification, position) {
    const window = new BrowserWindow({
      width: this.notificationWidth,
      height: this.notificationHeight,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      },
      show: false
    });

    const notificationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Tasky Notification</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: transparent;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              overflow: hidden;
            }
            
            .notification-container {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              animation: slideIn 0.3s ease-out;
            }
            
            .notification {
              background: #7f7f7c;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(10px);
              color: white;
              position: relative;
              width: calc(100% - 20px);
              margin: 10px;
            }
            
            .notification-header {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            
            .notification-icon {
              font-size: 24px;
              margin-right: 10px;
              animation: pulse 2s infinite;
            }
            
            .notification-title {
              font-weight: 600;
              font-size: 16px;
              margin: 0;
              flex: 1;
            }
            
            .close-btn {
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              transition: background-color 0.2s;
            }
            
            .close-btn:hover {
              background: rgba(255, 255, 255, 0.3);
            }
            
            .notification-message {
              margin: 0;
              font-size: 14px;
              line-height: 1.4;
              opacity: 0.95;
            }
            
            .notification-time {
              position: absolute;
              bottom: 8px;
              right: 12px;
              font-size: 11px;
              opacity: 0.7;
            }
            
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            
            @keyframes slideOut {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(100%);
                opacity: 0;
              }
            }
            
            @keyframes pulse {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.1);
              }
              100% {
                transform: scale(1);
              }
            }
            
            .sliding-out {
              animation: slideOut 0.3s ease-in forwards;
            }
          </style>
        </head>
        <body>
          <div class="notification-container">
            <div class="notification">
              <div class="notification-header">
                <div class="notification-icon">📋</div>
                <h3 class="notification-title">Reminder</h3>
                <button class="close-btn" onclick="closeNotification()">&times;</button>
              </div>
              <p class="notification-message">${notification.message}</p>
              <div class="notification-time">${this.formatTime(new Date())}</div>
            </div>
          </div>
          
          <script>
            let autoCloseTimer;
            
            function closeNotification() {
              const container = document.querySelector('.notification-container');
              container.classList.add('sliding-out');
              
              setTimeout(() => {
                if (window.electronAPI && window.electronAPI.closeCustomNotification) {
                  window.electronAPI.closeCustomNotification();
                } else {
                  window.close();
                }
              }, 300);
            }
            
            // Auto-close after 5 seconds
            autoCloseTimer = setTimeout(closeNotification, 5000);
            
            // Pause auto-close on hover
            document.addEventListener('mouseenter', () => {
              clearTimeout(autoCloseTimer);
            });
            
            // Resume auto-close when mouse leaves
            document.addEventListener('mouseleave', () => {
              autoCloseTimer = setTimeout(closeNotification, 2000);
            });
            
            // Handle click to close
            document.addEventListener('click', (e) => {
              if (!e.target.classList.contains('close-btn')) {
                closeNotification();
              }
            });
          </script>
        </body>
      </html>
    `;

    window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(notificationHtml)}`);

    // Position the window
    this.positionWindow(window, position);
    
    // Show with animation
    window.show();

    // Handle window closed
    window.on('closed', () => {
      this.removeNotification(notification.id);
    });

    return window;
  }

  positionWindow(window, position) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    const x = width - this.notificationWidth - this.margin;
    const y = height - ((position + 1) * (this.notificationHeight + this.margin));
    
    window.setPosition(x, y);
  }

  showNotification(notification) {
    const id = notification.id || Date.now().toString();
    const notificationData = { ...notification, id };
    
    // If we have too many notifications, queue this one
    if (this.activeNotifications.size >= this.maxVisibleNotifications) {
      this.notificationQueue.push(notificationData);
      return;
    }
    
    // Find available position
    let position = 0;
    while (Array.from(this.activeNotifications.values()).some(n => n.position === position)) {
      position++;
    }
    
    // Create and show notification window
    const window = this.createNotificationWindow(notificationData, position);
    
    this.activeNotifications.set(id, {
      window,
      position,
      notification: notificationData,
      createdAt: Date.now()
    });
    
    // Auto-remove after 6 seconds (slightly longer than auto-close)
    setTimeout(() => {
      this.removeNotification(id);
    }, 6000);
  }

  removeNotification(id) {
    const notificationData = this.activeNotifications.get(id);
    if (notificationData) {
      // Close window if it's still open
      if (notificationData.window && !notificationData.window.isDestroyed()) {
        notificationData.window.close();
      }
      
      this.activeNotifications.delete(id);
      
      // Reposition remaining notifications
      this.repositionNotifications();
      
      // Show queued notification if any
      if (this.notificationQueue.length > 0) {
        const queuedNotification = this.notificationQueue.shift();
        setTimeout(() => {
          this.showNotification(queuedNotification);
        }, 100); // Small delay for smooth animation
      }
    }
  }

  repositionNotifications() {
    const notifications = Array.from(this.activeNotifications.values())
      .sort((a, b) => a.createdAt - b.createdAt);
    
    notifications.forEach((notificationData, index) => {
      notificationData.position = index;
      if (!notificationData.window.isDestroyed()) {
        this.positionWindow(notificationData.window, index);
      }
    });
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  clearAllNotifications() {
    // Close all active notifications
    for (const [id, notificationData] of this.activeNotifications) {
      if (!notificationData.window.isDestroyed()) {
        notificationData.window.close();
      }
    }
    
    this.activeNotifications.clear();
    this.notificationQueue = [];
  }

  getActiveCount() {
    return this.activeNotifications.size;
  }

  getQueuedCount() {
    return this.notificationQueue.length;
  }
}

module.exports = CustomNotificationWindow;