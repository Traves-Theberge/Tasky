
const character = document.getElementById('clippy-character');
const bubble = document.getElementById('notification-bubble');
const { ipcRenderer } = require('electron');

let isDelivering = false;
let bubbleSide = 'left';
let notificationColor = '#7f7f7c';
let notificationFont = 'system';
let notificationTextColor = '#ffffff';

// Simple IPC handlers
ipcRenderer.on('set-initial-avatar', (event, data) => {
  if (character && data && data.avatars && data.selectedAvatar) {
    const avatarChar = data.avatars[data.selectedAvatar] || data.avatars['Clippy'] || 'C';
    character.textContent = avatarChar;
  }
});

ipcRenderer.on('clippy-speak', (event, message) => {
  if (bubble) {
    bubble.style.position = 'absolute';
    bubble.style.background = notificationColor;
    bubble.style.color = notificationTextColor;
    bubble.style.padding = '12px 16px';
    bubble.style.borderRadius = '20px';
    bubble.style.top = '50%';
    bubble.style.transform = 'translateY(-50%)';
    bubble.style.zIndex = '1000';
    bubble.style.opacity = '1';
    bubble.style.display = 'block';
    bubble.style.fontSize = '14px';
    bubble.style.wordWrap = 'break-word';
    bubble.style.wordBreak = 'break-word';
    bubble.style.overflowWrap = 'break-word';
    bubble.style.whiteSpace = 'normal';
    bubble.style.width = 'auto';
    bubble.style.minWidth = '180px';
    
    // Apply custom font
    if (notificationFont === 'system') {
      bubble.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else {
      bubble.style.fontFamily = notificationFont;
    }
    
    // Position bubble based on bubbleSide setting
    // Window: 800px wide, Avatar container spans 200px-400px
    if (bubbleSide === 'right') {
      // Position bubble to the right of avatar
      bubble.style.left = '420px';  // Start 20px after avatar ends (400px + 20px)
      bubble.style.right = 'auto';
      bubble.style.maxWidth = '350px'; // Full width for right side
    } else {
      // Position bubble to the left of avatar  
      // Avatar starts at 200px, so bubble should end before that with gap
      bubble.style.left = '20px';   // Start from left edge with margin
      bubble.style.right = 'auto';
      bubble.style.maxWidth = '160px'; // Constrain width to fit (200px - 20px start - 20px gap = 160px)
    }
    
    bubble.textContent = message;
    
    setTimeout(() => {
      bubble.style.display = 'none';
    }, 5000);
  }
});

ipcRenderer.on('clippy-change-avatar', (event, avatarName) => {
  if (character) {
    // Update the avatar display based on the name
    // DISCLAIMER: The 'Clippy' character is a fan art tribute to Microsoft's Office Assistant.
    // This is an educational/personal project not affiliated with Microsoft Corporation.
    // All trademarks are property of their respective owners.
    const avatars = {
      'Clippy': '📎',
      'Merlin': '🧙‍♂️',
      'Rover': '🐕',
      'Genie': '🧞‍♂️',
      'Rocky': '🗿',
      'Bonzi': '🐵',
      'Peedy': '🦜',
      'Links': '⛳',
      'Custom': ''
    };
    
    if (avatarName === 'Custom' || avatarName.startsWith('custom_')) {
      // Custom avatar will be handled by separate IPC message
      character.textContent = '';
    } else {
      const avatarChar = avatars[avatarName] || avatars['Clippy'];
      character.textContent = avatarChar;
    }
  }
});

ipcRenderer.on('clippy-set-custom-avatar', (event, filePath) => {
  if (character && filePath) {
    character.innerHTML = '';
    character.textContent = '';
    
    // Request data URL from main process
    const { ipcRenderer: ipc } = require('electron');
    ipc.invoke('get-avatar-data-url', filePath).then(dataUrl => {
      if (dataUrl) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        img.style.webkitUserSelect = 'none';
        img.style.mozUserSelect = 'none';
        img.style.msUserSelect = 'none';
        img.style.userSelect = 'none';
        img.style.webkitAppRegion = 'drag';
        img.draggable = false;
        character.appendChild(img);
      }
    }).catch(error => {
      console.error('Failed to load custom avatar data URL:', error);
    });
  }
});

ipcRenderer.on('set-dragging-mode', (event, enabled) => {
  const container = document.getElementById('clippy-container');
  
  if (container && character) {
    if (enabled) {
      // Enable dragging
      container.style.webkitAppRegion = 'drag';
      container.style.cursor = 'move';
      character.style.webkitAppRegion = 'drag';
      character.style.cursor = 'move';
      character.style.opacity = '1';
    } else {
      // Disable dragging but keep clickable and visible
      container.style.webkitAppRegion = 'no-drag';
      container.style.cursor = 'pointer';
      character.style.webkitAppRegion = 'no-drag';
      character.style.cursor = 'pointer';
      character.style.opacity = '1'; // Ensure it stays fully visible
    }
  }
});

ipcRenderer.on('toggle-animation', (event, enabled) => {
  if (character) {
    if (enabled) {
      // Enable animations
      character.style.animation = 'bounce 2s infinite';
    } else {
      // Disable animations
      character.style.animation = 'none';
      character.style.transform = 'scale(1)';
    }
  }
});

ipcRenderer.on('clippy-set-bubble-side', (event, side) => {
  bubbleSide = side;
  console.log('Bubble side changed to:', side);
  
  // If there's currently a visible bubble, update its position immediately
  if (bubble && bubble.style.display === 'block') {
    if (bubbleSide === 'right') {
      bubble.style.left = '350px';
      bubble.style.right = 'auto';
    } else {
      bubble.style.right = '350px';
      bubble.style.left = 'auto';
    }
  }
});

ipcRenderer.on('clippy-set-notification-color', (event, color) => {
  notificationColor = color;
  console.log('Notification color changed to:', color);
});

ipcRenderer.on('clippy-set-notification-font', (event, font) => {
  notificationFont = font;
  console.log('Notification font changed to:', font);
});

ipcRenderer.on('clippy-set-notification-text-color', (event, color) => {
  notificationTextColor = color;
  console.log('Notification text color changed to:', color);
});

