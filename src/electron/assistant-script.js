
const character = document.getElementById('clippy-character');
const bubble = document.getElementById('notification-bubble');
const { ipcRenderer } = require('electron');

let isDelivering = false;
let bubbleSide = 'left';

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
    bubble.style.background = '#7f7f7c';
    bubble.style.color = 'white';
    bubble.style.padding = '12px 16px';
    bubble.style.borderRadius = '20px';
    bubble.style.top = '50%';
    bubble.style.transform = 'translateY(-50%)';
    bubble.style.zIndex = '1000';
    bubble.style.opacity = '1';
    bubble.style.display = 'block';
    bubble.style.maxWidth = '250px';
    bubble.style.fontSize = '14px';
    
    // Position bubble based on bubbleSide setting
    if (bubbleSide === 'right') {
      bubble.style.left = '350px';
      bubble.style.right = 'auto';
    } else {
      bubble.style.right = '350px';
      bubble.style.left = 'auto';
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

