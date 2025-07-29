# Tasky - Your Friendly Reminder Assistant

A Windows tray application built with Electron, Vite, and React that delivers recurring workday reminders with an animated assistant.

## Features

✅ **Core Functionality**
- 📋 System tray integration with context menu
- ⏰ Recurring reminder scheduling for workdays using cron patterns
- 🔔 Native system notifications with optional sound alerts
- 💾 Persistent data storage across app restarts
- 🎨 Modern React-based settings interface

✅ **Enhanced Features**
- 📎 Animated Clippy-style assistant for friendly interactions
- ✨ Custom animated pop-up notifications
- 🎯 Windows-specific optimizations (AppUserModelID, auto-launch)
- 🌟 Smooth UI animations with Framer Motion
- 🔊 Customizable sound notifications

## Architecture

- **Main Process**: Handles tray icon, scheduling, notifications, and data persistence
- **Renderer Process**: React-based settings UI with modern animations
- **IPC Communication**: Secure communication between processes using contextBridge
- **Data Storage**: JSON-based configuration using electron-store
- **Scheduling**: Cron-based recurring reminders with node-cron

## Installation & Usage

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development**
   ```bash
   npm start
   ```

3. **Build Application**
   ```bash
   npm run package
   ```

4. **Create Installer**
   ```bash
   npm run make
   ```

## Usage

1. **Access Settings**: Right-click the tray icon and select "📋 Open Settings"
2. **Add Reminders**: Set message, time, and days in the settings window
3. **Configure Options**: Toggle notifications, sound, assistant, and auto-start
4. **Test**: Use "🔄 Test Notification" to verify everything works

## Project Structure

```
src/
├── electron/              # Main process modules
│   ├── scheduler.js       # Cron-based reminder scheduling
│   ├── storage.js         # Data persistence with electron-store
│   ├── assistant.js       # Animated assistant window
│   └── customNotification.js # Custom pop-up notifications
├── renderer/              # React application files
├── assets/                # Icons, sounds, and static files
├── main.js                # Main Electron process
├── preload.js             # IPC security bridge
└── App.jsx                # React UI with animations
```

## Technologies Used

- **Electron**: Desktop application framework
- **Vite**: Fast build tool and development server
- **React**: UI framework with hooks
- **Framer Motion**: Smooth animations and transitions
- **node-cron**: Cron-based job scheduling
- **electron-store**: Persistent configuration storage
- **sound-play**: Audio playback for notifications

## Key Features Implemented

1. **System Tray Integration**: Always accessible from system tray
2. **Workday Scheduling**: Smart cron patterns for business days
3. **Multiple Notification Types**: Native system + custom animated pop-ups
4. **Animated Assistant**: Clippy-style helper with speech bubbles
5. **Persistent Settings**: Remembers preferences across restarts
6. **Windows Optimization**: Proper AppUserModelID and auto-launch
7. **Modern UI**: Animated interface with Framer Motion
8. **Sound Support**: Optional audio alerts with system fallbacks

## Development Notes

- Uses secure IPC communication with context isolation
- Implements proper app lifetime management for tray applications
- Includes Windows-specific packaging configuration
- Features comprehensive error handling and fallbacks
- Built with modern ES6+ JavaScript and React hooks

## License

MIT License - feel free to use and modify as needed!