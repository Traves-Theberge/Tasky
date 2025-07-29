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
      alwaysOnTop: true,
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
              cursor: pointer;
            }
            
            #clippy-container {
              position: absolute;
              width: 200px;
              height: 200px;
              left: 50%;
              top: 0;
              transform: translateX(-50%);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.3s ease;
              -webkit-app-region: drag; /* Make the container draggable */
              cursor: move;
            }
            
            #clippy-container:hover {
              transform: translateX(-50%) scale(1.1);
            }
            
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
              'Links': '⛳'
            };
            
            const character = document.getElementById('clippy-character');
            const bubble = document.getElementById('notification-bubble');
            
            // Set initial character to selected avatar
            const selectedAvatar = '${this.selectedAvatar}';
            character.textContent = avatars[selectedAvatar] || avatars['Clippy'] || '📎';
            
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
            
            // Hover interaction
            document.addEventListener('mouseenter', () => {
              if (!isDelivering && animationsEnabled) {
                character.style.animation = 'none';
                character.style.transform = 'scale(1.1)';
              }
            });
            
            document.addEventListener('mouseleave', () => {
              if (!isDelivering && animationsEnabled) {
                character.style.transform = 'scale(1)';
                character.style.animation = 'bounce 2s infinite';
              }
            });
            
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
              console.log('Changing avatar to:', avatarName);
              character.textContent = avatars[avatarName] || avatars['Clippy'];
            });
            
            ipcRenderer.on('clippy-set-bubble-side', (event, side) => {
              console.log('Setting bubble side to:', side);
              bubbleSide = side;
            });
            
            ipcRenderer.on('clippy-hide', () => {
              document.body.style.opacity = '0';
            });
            
            ipcRenderer.on('clippy-show', () => {
              document.body.style.opacity = '1';
            });
            
            // Handle upcoming notifications response
            ipcRenderer.on('upcoming-notifications-response', (event, notifications) => {
              if (notifications.length === 0) {
                // Show no upcoming notifications message
                bubble.className = 'notification-bubble ' + bubbleSide;
                bubble.textContent = "You don't have any upcoming reminders set up! 😊";
                bubble.classList.add('show');
                
                setTimeout(() => {
                  bubble.classList.remove('show');
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
    
    // Make it stay in position
    this.window.setAlwaysOnTop(true, 'screen-saver', 1);

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
    
    // If window exists, destroy and recreate to ensure proper initialization
    if (this.window) {
      const wasVisible = this.isVisible;
      this.destroy();
      
      if (wasVisible) {
        // Recreate the window with new avatar
        setTimeout(() => {
          this.show();
        }, 100);
      }
    }
  }

  setBubbleSide(side) {
    console.log('Setting bubble side to:', side);
    if (this.window && this.isVisible) {
      this.window.webContents.send('clippy-set-bubble-side', side);
    }
  }
}

module.exports = ClippyAssistant;