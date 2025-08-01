/**
 * ClippyAssistant - Desktop Companion for Tasky
 * 
 * Manages an animated desktop assistant that displays reminders and provides
 * a friendly interface for the application. Supports multiple avatar types,
 * customizable positioning, and interactive speech bubbles.
 */

const { BrowserWindow, screen } = require('electron');
const path = require('path');

class ClippyAssistant {
  constructor() {
    this.window = null;
    this.isVisible = false;
    this.isPersistent = true; // Always show as desktop companion
    this.isDelivering = false; // Track if currently delivering notification
    this.selectedAvatar = 'Clippy'; // Default avatar
    this.bubbleSide = 'left'; // Default bubble side
  }

  create() {
    if (this.window) {
      return this.window;
    }


    this.window = new BrowserWindow({
      width: 600, // Wider to accommodate speech bubbles
      height: 200,
      frame: false,
      transparent: true,
      alwaysOnTop: true, // Start with always on top, will be adjusted by layer setting
      skipTaskbar: true,
      resizable: false,
      movable: true, // Enable dragging
      minimizable: false,
      maximizable: false,
      closable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        backgroundThrottling: false // Prevent performance throttling
      },
      show: false,
      opacity: 1.0 // Ensure full opacity
    });

    // Default to click-through mode (dragging disabled)
    // This will be set properly by setDraggingMode() from main.js

    // Create assistant HTML using separate method to avoid template literal issues
    const clippyHtml = this.createAssistantHTML();

    this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(clippyHtml)}`);

    // Add DOM ready event to verify content loads
    this.window.webContents.once('dom-ready', () => {
      
      // Send initial avatar data
      setTimeout(() => {
        const avatarData = {
          selectedAvatar: this.selectedAvatar,
          avatars: {
            'Clippy': '📎',
            'Merlin': '🧙‍♂️',
            'Rover': '🐕',
            'Genie': '🧞‍♂️',
            'Rocky': '🗿',
            'Bonzi': '🐵',
            'Peedy': '🦜',
            'Links': '⛳',
            'Custom': ''
          }
        };
        this.window.webContents.send('set-initial-avatar', avatarData);
        
        // Send initial bubble side setting
        this.window.webContents.send('clippy-set-bubble-side', this.bubbleSide);
        
      }, 100);
    });

    this.window.webContents.on('did-finish-load', () => {
    });

    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('❌ Clippy window failed to load:', errorCode, errorDescription);
    });

    this.window.on('closed', () => {
      this.window = null;
      this.isVisible = false;
    });

    // DevTools removed for production

    return this.window;
  }

  createAssistantHTML() {
    const scriptPath = path.join(__dirname, 'assistant-script.js');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Clippy Assistant</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      -webkit-app-region: no-drag;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    #clippy-container {
      position: absolute;
      width: 200px;
      height: 200px;
      left: 200px;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-app-region: drag;
      cursor: move;
      z-index: 20;
    }
    
    #clippy-character {
      font-size: 80px;
      animation: bounce 2s infinite;
      cursor: move;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      -webkit-app-region: drag;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      opacity: 1;
      transition: opacity 0.2s ease;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    .notification-bubble {
      position: absolute;
      background: #7f7f7c;
      color: white;
      padding: 12px 16px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 250px;
      min-width: 180px;
      word-wrap: break-word;
      font-size: 14px;
      font-weight: 500;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 1000;
      pointer-events: none;
      white-space: pre-wrap;
      line-height: 1.4;
      -webkit-app-region: no-drag;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    #clippy-character img {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      -webkit-app-region: drag;
    }
  </style>
</head>
<body>
  <div id="notification-bubble" class="notification-bubble"></div>
  <div id="clippy-container">
    <div id="clippy-character">📎</div>
  </div>
  
  <script src="file://${scriptPath.replace(/\\/g, '/')}"></script>
</body>
</html>`;
  }


  show(message) {
    if (!this.window) {
      this.create();
    }

    // Position in bottom-right corner as persistent desktop companion
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    // Position in bottom-right corner with small margin
    // Clippy is centered in a 600px wide window, so we need more margin
    const xPos = width - 620;  // 600px width + 20px margin
    const yPos = height - 220; // 200px height + 20px margin
    
    this.window.setPosition(xPos, yPos);
    this.window.show();
    this.window.focus(); // Ensure window gets focus
    this.isVisible = true;
    
    // Assistant window positioned and ready
    
    // Layer setting will be applied by main.js after window creation

    // Send message to Clippy with better error handling
    if (message) {
      setTimeout(() => {
        if (this.window && this.window.webContents) {
          this.window.webContents.send('clippy-speak', message);
        }
      }, 1000); // Reduced wait time since we're not loading external library
    }
  }

  hide() {
    if (this.window) {
      this.window.hide();
      this.isVisible = false;
    }
  }

  speak(message) {
    if (!this.isVisible) {
      this.show();
      setTimeout(() => {
        if (this.window && this.window.webContents && !this.window.webContents.isDestroyed()) {
          this.window.webContents.send('clippy-speak', message);
        }
      }, 1500);
    } else if (this.window && this.window.webContents && !this.window.webContents.isDestroyed()) {
      this.window.webContents.send('clippy-speak', message);
    }
  }

  animate(animation = 'Congratulate') {
    if (this.window && this.isVisible) {
      this.window.webContents.send('clippy-animate', animation);
    }
  }

  destroy() {
    if (this.window) {
      this.window.close();
      this.window = null;
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  setAvatar(avatarName) {
    this.selectedAvatar = avatarName;
    
    if (this.window) {
      this.window.webContents.send('clippy-change-avatar', avatarName);
      
      // If it's a custom avatar, also send the custom path immediately
      if (avatarName === 'Custom' || avatarName.startsWith('custom_')) {
        setTimeout(() => {
          const TaskyStore = require('./storage');
          const store = new TaskyStore();
          const customPath = store.getSetting('customAvatarPath');
          if (customPath) {
            this.setCustomAvatarPath(customPath);
          }
        }, 200);
      }
    }
  }

  setBubbleSide(side) {
    // Store the bubble side preference
    this.bubbleSide = side;
    
    // Send to window if it exists (whether visible or not)
    if (this.window && this.window.webContents && !this.window.webContents.isDestroyed()) {
      this.window.webContents.send('clippy-set-bubble-side', side);
    }
  }

  setDraggingMode(enabled) {
    if (this.window && this.window.webContents) {
      // Send dragging mode to the renderer process to handle CSS changes
      this.window.webContents.send('set-dragging-mode', enabled);
    }
  }

  setCustomAvatarPath(filePath) {
    if (this.window) {
      setTimeout(() => {
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('clippy-set-custom-avatar', filePath);
        }
      }, 100);
    }
  }

  setLayer(layer) {
    if (this.window) {
      try {
        if (layer === 'below') {
          // Set window below other windows
          this.window.setAlwaysOnTop(false);
          // For Windows, try to set to desktop level
          if (process.platform === 'win32') {
            // Windows-specific: try to set window behind other windows
            this.window.setSkipTaskbar(true);
            this.window.blur(); // Remove focus so it goes behind
          } else if (typeof this.window.setLevel === 'function') {
            this.window.setLevel('desktop');
          }
        } else {
          // Set window above other windows (default)
          this.window.setAlwaysOnTop(true);
          this.window.setSkipTaskbar(true);
          if (process.platform === 'win32') {
            // Additional Windows-specific settings
            this.window.setVisibleOnAllWorkspaces(true);
          }
        }
      } catch (error) {
        // Fallback to basic always on top behavior
        if (layer === 'below') {
          this.window.setAlwaysOnTop(false);
        } else {
          this.window.setAlwaysOnTop(true);
        }
      }
    }
  }
}

module.exports = ClippyAssistant;