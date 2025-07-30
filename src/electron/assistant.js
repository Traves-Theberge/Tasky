const { BrowserWindow, screen } = require('electron');
const path = require('path');

class ClippyAssistant {
  constructor() {
    this.window = null;
    this.isVisible = false;
    this.isPersistent = true; // Always show as desktop companion
    this.isDelivering = false; // Track if currently delivering notification
    this.selectedAvatar = 'Clippy'; // Default avatar
  }

  create() {
    if (this.window) {
      return this.window;
    }

    console.log('Creating Clippy assistant window...');

    this.window = new BrowserWindow({
      width: 600, // Wider to accommodate speech bubbles
      height: 200,
      frame: false,
      transparent: true,
      alwaysOnTop: false, // Will be set by layer setting
      skipTaskbar: true,
      resizable: false,
      movable: true, // Enable dragging
      minimizable: false,
      maximizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      },
      show: false
    });

    // Default to click-through mode (dragging disabled)
    // This will be set properly by setDraggingMode() from main.js

    // Create simple Clippy HTML with fallback
    const clippyHtml = `
      <!DOCTYPE html>
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
              -webkit-app-region: no-drag; /* Default: no drag */
            }
            
            #clippy-container {
              position: absolute;
              width: 200px;
              height: 200px;
              left: 200px; /* Center in 600px window: (600-200)/2 = 200 */
              top: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              -webkit-app-region: drag; /* Only the assistant is draggable */
              cursor: move;
              z-index: 20; /* Above click-through zones */
            }
            
            /* Remove hover transform that interferes with dragging */
            
            #clippy-character {
              font-size: 80px;
              animation: bounce 2s infinite;
              cursor: move;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              -webkit-app-region: drag; /* Make character draggable */
            }
            
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
              }
              40% {
                transform: translateY(-10px);
              }
              60% {
                transform: translateY(-5px);
              }
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
            }
            
            .notification-bubble.show {
              opacity: 1;
            }
            
            /* Left side bubble (default) */
            .notification-bubble.left {
              right: 350px; /* Position further to the left of centered Clippy */
            }
            
            .notification-bubble.left.show {
              right: 350px;
            }
            
            .notification-bubble.left::after {
              content: '';
              position: absolute;
              left: 100%;
              top: 50%;
              transform: translateY(-50%);
              width: 0;
              height: 0;
              border-left: 10px solid #7f7f7c;
              border-top: 10px solid transparent;
              border-bottom: 10px solid transparent;
            }
            
            /* Right side bubble */
            .notification-bubble.right {
              left: 350px; /* Position double distance to the right of centered Clippy */
            }
            
            .notification-bubble.right.show {
              left: 350px;
            }
            
            .notification-bubble.right::after {
              content: '';
              position: absolute;
              right: 100%;
              top: 50%;
              transform: translateY(-50%);
              width: 0;
              height: 0;
              border-right: 10px solid #7f7f7c;
              border-top: 10px solid transparent;
              border-bottom: 10px solid transparent;
            }
            
          </style>
        </head>
        <body>
          <div id="notification-bubble" class="notification-bubble"></div>
          <div id="clippy-container">
            <div id="clippy-character">📎</div>
          </div>
          
          <script>
            console.log('Clippy window loaded successfully!');
            
            let isDelivering = false;
            let bubbleSide = 'left'; // Default bubble position
            
            // Avatar characters
            const avatars = {
              'Clippy': '📎',
              'Merlin': '🧙‍♂️',
              'Rover': '🐕',
              'Genie': '🧞‍♂️',
              'Rocky': '🗿',
              'Bonzi': '🐵',
              'Peedy': '🦜',
              'Links': '⛳',
              'Custom': '' // No fallback frame
            };
            
            const character = document.getElementById('clippy-character');
            const bubble = document.getElementById('notification-bubble');
            
            // Set initial character to selected avatar
            const selectedAvatar = '${this.selectedAvatar}';
            if (selectedAvatar === 'Custom' || selectedAvatar.startsWith('custom_')) {
              // For custom avatars, leave blank initially - custom image will be set via IPC
              character.textContent = '';
            } else {
              character.textContent = avatars[selectedAvatar] || avatars['Clippy'] || '📎';
            }
            
            let animationsEnabled = true; // Default to enabled
            
            // Idle animations
            function playIdleAnimation() {
              if (!isDelivering && animationsEnabled) {
                character.style.animation = 'none';
                setTimeout(() => {
                  character.style.animation = 'bounce 2s infinite';
                }, 100);
              }
              setTimeout(playIdleAnimation, 8000 + Math.random() * 12000);
            }
            
            // Start idle animations
            setTimeout(playIdleAnimation, 5000);
            
            // Click interaction - show upcoming notifications
            character.addEventListener('click', () => {
              if (!isDelivering) {
                character.style.transform = 'scale(1.2)';
                setTimeout(() => {
                  character.style.transform = 'scale(1)';
                }, 200);
                
                // Request upcoming notifications from main process
                ipcRenderer.send('get-upcoming-notifications');
              }
            });
            
            // No hover events - they interfere with dragging
            
            // IPC Communication
            const { ipcRenderer } = require('electron');
            
            ipcRenderer.on('clippy-speak', (event, message) => {
              console.log('Clippy received message:', message);
              isDelivering = true;
              
              // Set bubble position and content
              bubble.className = 'notification-bubble ' + bubbleSide;
              bubble.textContent = message;
              bubble.classList.add('show');
              
              // Play attention animation if enabled
              if (animationsEnabled) {
                character.style.animation = 'none';
                character.style.transform = 'scale(1.3)';
                
                setTimeout(() => {
                  character.style.transform = 'scale(1)';
                  character.style.animation = 'bounce 2s infinite';
                }, 500);
              }
              
              // Hide bubble after message
              setTimeout(() => {
                bubble.classList.remove('show');
                isDelivering = false;
              }, 5000);
            });
            
            ipcRenderer.on('clippy-change-avatar', (event, avatarName) => {
              console.log('=== AVATAR CHANGE EVENT ===');
              console.log('Changing avatar to:', avatarName);
              if (avatarName === 'Custom' || avatarName.startsWith('custom_')) {
                console.log('This is a custom avatar - waiting for custom image path');
                // Don't set placeholder immediately, wait for the custom avatar path
                // character.textContent = '🖼️';
              } else {
                console.log('This is a default avatar');
                character.textContent = avatars[avatarName] || avatars['Clippy'];
                // Clear any custom image HTML if switching away from custom
                character.innerHTML = '';
                character.textContent = avatars[avatarName] || avatars['Clippy'];
              }
              console.log('Character content set to:', character.textContent || character.innerHTML);
              console.log('=== END AVATAR CHANGE EVENT ===');
            });
            
            ipcRenderer.on('clippy-set-bubble-side', (event, side) => {
              console.log('Setting bubble side to:', side);
              bubbleSide = side;
            });

            ipcRenderer.on('clippy-set-custom-avatar', (event, filePath) => {
              console.log('=== CUSTOM AVATAR DEBUG ===');
              console.log('Original file path:', filePath);
              if (filePath) {
                // Clear any existing content first
                character.innerHTML = '';
                character.textContent = '';
                
                // Normalize Windows path for web display
                let normalizedPath = filePath.replace(/\\/g, '/');
                // Ensure proper file protocol format
                const webPath = 'file:///' + normalizedPath;
                
                console.log('Setting custom avatar with path:', webPath);
                
                // Create a single image element with proper error handling
                const img = document.createElement('img');
                img.src = webPath;
                img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; display: block;';
                
                img.onload = function() {
                  console.log('✅ Custom avatar loaded successfully:', this.src);
                };
                
                img.onerror = function() {
                  console.error('❌ Custom avatar failed to load:', this.src);
                  console.error('Original file path was:', filePath);
                  
                  // Try alternative path formats
                  const alternatives = [
                    normalizedPath,
                    filePath,
                    filePath.replace(/\\/g, '/'),
                    'file://' + normalizedPath,
                    'file://' + filePath.replace(/\\/g, '/'),
                  ];
                  
                  const currentAttempt = parseInt(this.dataset.attempt || '0');
                  if (currentAttempt < alternatives.length - 1) {
                    const nextAttempt = currentAttempt + 1;
                    this.dataset.attempt = nextAttempt.toString();
                    const nextPath = `file:///${alternatives[nextAttempt].replace(/^file:\/\/\//, '')}`;
                    console.log(`Trying attempt ${nextAttempt}: ${nextPath}`);
                    this.src = nextPath;
                  } else {
                    console.error('All path variants failed for desktop assistant, hiding image');
                    this.style.display = 'none';
                  }
                };
                
                character.appendChild(img);
                console.log('Custom avatar image element created and added');
              } else {
                console.error('❌ No file path provided for custom avatar');
                character.textContent = '';
              }
              console.log('=== END CUSTOM AVATAR DEBUG ===');
            });
            
            ipcRenderer.on('clippy-hide', () => {
              document.body.style.opacity = '0';
            });
            
            ipcRenderer.on('clippy-show', () => {
              document.body.style.opacity = '1';
            });
            
            // Handle upcoming notifications response
            ipcRenderer.on('upcoming-notifications-response', (event, notifications) => {
              isDelivering = true;
              
              if (notifications.length === 0) {
                // Show no upcoming notifications message
                bubble.className = 'notification-bubble ' + bubbleSide;
                bubble.textContent = "You don't have any upcoming reminders set up! 😊";
                bubble.classList.add('show');
                
                setTimeout(() => {
                  bubble.classList.remove('show');
                  isDelivering = false;
                }, 4000);
              } else {
                // Show upcoming notifications
                const upcomingText = "Here are your upcoming reminders:\\n\\n" + 
                  notifications.slice(0, 3).map(n => 
                    "• " + n.message + " at " + n.time + " (" + n.days.join(', ') + ")"
                  ).join('\\n') +
                  (notifications.length > 3 ? "\\n\\n...and " + (notifications.length - 3) + " more!" : '');
                
                bubble.className = 'notification-bubble ' + bubbleSide;
                bubble.textContent = upcomingText;
                bubble.classList.add('show');
                
                setTimeout(() => {
                  bubble.classList.remove('show');
                  isDelivering = false;
                }, 8000);
              }
            });
            
            // Handle animation toggle
            ipcRenderer.on('toggle-animation', (event, enabled) => {
              console.log('Animation toggle received:', enabled);
              animationsEnabled = enabled;
              
              if (!enabled) {
                // Stop current animations
                character.style.animation = 'none';
                character.style.transform = 'scale(1)';
              } else {
                // Resume animations if not delivering
                if (!isDelivering) {
                  character.style.animation = 'bounce 2s infinite';
                }
              }
            });
            
            console.log('Clippy is ready and visible!');
          </script>
        </body>
      </html>
    `;

    this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(clippyHtml)}`);

    this.window.on('closed', () => {
      this.window = null;
      this.isVisible = false;
    });

    // No special mouse event handling - keep window always interactive

    console.log('Clippy window created successfully');
    return this.window;
  }

  show(message) {
    console.log('Clippy show() called');
    
    if (!this.window) {
      console.log('Creating new Clippy window...');
      this.create();
    }

    // Position in bottom-right corner as persistent desktop companion
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    // Position in bottom-right corner with small margin
    // Clippy is centered in a 600px wide window, so we need more margin
    const xPos = width - 620;  // 600px width + 20px margin
    const yPos = height - 220; // 200px height + 20px margin
    
    console.log('Positioning Clippy desktop companion at:', xPos, yPos);
    this.window.setPosition(xPos, yPos);
    this.window.show();
    this.isVisible = true;
    
    // Layer setting will be applied by main.js after window creation

    // Send message to Clippy with better error handling
    if (message) {
      setTimeout(() => {
        console.log('Sending message to Clippy:', message);
        if (this.window && this.window.webContents) {
          this.window.webContents.send('clippy-speak', message);
        } else {
          console.error('Clippy window or webContents not available');
        }
      }, 1000); // Reduced wait time since we're not loading external library
    }
  }

  hide() {
    // Desktop companion doesn't hide unless explicitly destroyed
    console.log('Hide called - but desktop companion stays visible');
  }

  speak(message) {
    console.log('Clippy delivering notification:', message);
    if (!this.isVisible) {
      console.log('Clippy not visible, creating companion window');
      this.show();
      // Wait a moment for window to be ready, then deliver message
      setTimeout(() => {
        if (this.window) {
          this.window.webContents.send('clippy-speak', message);
        }
      }, 1500);
    } else if (this.window) {
      console.log('Clippy companion delivering message');
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
    console.log('Setting avatar to:', avatarName);
    this.selectedAvatar = avatarName;
    
    // Don't recreate window - just send the change event
    if (this.window) {
      this.window.webContents.send('clippy-change-avatar', avatarName);
      
      // If it's a custom avatar, also send the custom path immediately
      if (avatarName === 'Custom' || avatarName.startsWith('custom_')) {
        console.log('🔄 Custom avatar detected in setAvatar:', avatarName);
        setTimeout(() => {
          const TaskyStore = require('./storage');
          const store = new TaskyStore();
          const customPath = store.getSetting('customAvatarPath');
          console.log('=== ASSISTANT CUSTOM AVATAR LOOKUP ===');
          console.log('Avatar name:', avatarName);
          console.log('Custom path from storage:', customPath);
          console.log('Window exists:', !!this.window);
          if (customPath) {
            console.log('✅ Found custom path, sending to window:', customPath);
            this.setCustomAvatarPath(customPath);
          } else {
            console.log('❌ No custom avatar path found in storage');
          }
          console.log('=== END ASSISTANT CUSTOM AVATAR ===');
        }, 200);
      }
    }
  }

  setBubbleSide(side) {
    console.log('Setting bubble side to:', side);
    if (this.window && this.isVisible) {
      this.window.webContents.send('clippy-set-bubble-side', side);
    }
  }

  setDraggingMode(enabled) {
    console.log('Setting dragging mode to:', enabled);
    if (this.window) {
      if (enabled) {
        // Enable dragging - make entire window interactive
        this.window.setIgnoreMouseEvents(false);
      } else {
        // Disable dragging - make notification areas click-through
        this.window.setIgnoreMouseEvents(true, {
          forward: true,
          shape: [
            // Left notification area (0 to 200px)
            { x: 0, y: 0, width: 200, height: 200 },
            // Right notification area (400 to 600px)  
            { x: 400, y: 0, width: 200, height: 200 }
          ]
        });
      }
    }
  }

  setCustomAvatarPath(filePath) {
    console.log('=== ASSISTANT setCustomAvatarPath ===');
    console.log('File path received:', filePath);
    console.log('Window exists:', !!this.window);
    console.log('Window destroyed:', this.window ? this.window.isDestroyed() : 'N/A');
    
    if (this.window) {
      // Wait a moment for the window to be ready
      setTimeout(() => {
        if (this.window && !this.window.isDestroyed()) {
          console.log('✅ Sending custom avatar path to window:', filePath);
          this.window.webContents.send('clippy-set-custom-avatar', filePath);
        } else {
          console.error('❌ Assistant window not available for custom avatar');
        }
      }, 100);
    } else {
      console.error('❌ No assistant window available for custom avatar');
    }
    console.log('=== END ASSISTANT setCustomAvatarPath ===');
  }

  setLayer(layer) {
    console.log('Setting assistant layer to:', layer);
    if (this.window) {
      try {
        if (layer === 'below') {
          // Set window to appear below other windows
          this.window.setAlwaysOnTop(false);
          // Try setLevel if available (macOS), otherwise just use setAlwaysOnTop(false)
          if (typeof this.window.setLevel === 'function') {
            this.window.setLevel('desktop');
          }
        } else {
          // Set window to appear above other windows (default)
          this.window.setAlwaysOnTop(true, 'screen-saver', 1);
        }
        console.log('✅ Assistant layer set successfully to:', layer);
      } catch (error) {
        console.error('❌ Error setting assistant layer:', error);
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