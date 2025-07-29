import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingSection } from '../components/SettingSection';
import { SettingItem } from '../components/SettingItem';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Bell, Settings, Smile, X } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('reminders');
  const [reminders, setReminders] = useState([]);
  const [settings, setSettings] = useState({
    enableSound: true,
    enableAssistant: true,
    enableNotifications: true,
    autoStart: false,
    notificationType: 'custom',
    selectedAvatar: 'Clippy',
    darkMode: false,
    enableAnimation: true,
  });

  useEffect(() => {
    // Load initial data when component mounts
    loadReminders();
    loadSettings();
  }, []);

  const loadReminders = async () => {
    try {
      const savedReminders = await window.electronAPI.getReminders();
      setReminders(savedReminders || []);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const enableSound = await window.electronAPI.getSetting('enableSound');
      const enableAssistant = await window.electronAPI.getSetting('enableAssistant');
      const enableNotifications = await window.electronAPI.getSetting('enableNotifications');
      const autoStart = await window.electronAPI.getSetting('autoStart');
      const notificationType = await window.electronAPI.getSetting('notificationType');
      const selectedAvatar = await window.electronAPI.getSetting('selectedAvatar');
      
      setSettings({
        enableSound: enableSound !== undefined ? enableSound : true,
        enableAssistant: enableAssistant !== undefined ? enableAssistant : true,
        enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
        autoStart: autoStart !== undefined ? autoStart : false,
        notificationType: notificationType !== undefined ? notificationType : 'custom',
        selectedAvatar: selectedAvatar !== undefined ? selectedAvatar : 'Clippy',
        darkMode: await window.electronAPI.getSetting('darkMode') || false,
        enableAnimation: await window.electronAPI.getSetting('enableAnimation') !== undefined ? await window.electronAPI.getSetting('enableAnimation') : true,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleAddReminder = (reminder) => {
    const newReminder = {
      id: Date.now().toString(),
      ...reminder,
    };
    
    window.electronAPI.addReminder(newReminder);
    setReminders([...reminders, newReminder]);
  };

  const handleRemoveReminder = (id) => {
    window.electronAPI.removeReminder(id);
    setReminders(reminders.filter(reminder => reminder.id !== id));
  };

  const handleEditReminder = (id, updatedReminder) => {
    window.electronAPI.updateReminder(id, updatedReminder);
    setReminders(reminders.map(reminder => 
      reminder.id === id ? { ...updatedReminder, id } : reminder
    ));
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    window.electronAPI.setSetting(key, value);
    
    if (key === 'enableNotifications') {
      window.electronAPI.toggleReminders(value);
    }
  };

  const handleTestNotification = () => {
    window.electronAPI.testNotification();
  };

  const handleAvatarChange = (avatar) => {
    const newSettings = { ...settings, selectedAvatar: avatar };
    setSettings(newSettings);
    window.electronAPI.setSetting('selectedAvatar', avatar);
    window.electronAPI.changeAvatar(avatar);
  };

  const handleCloseApp = () => {
    window.electronAPI.closeWindow();
  };

  const tabs = [
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'avatar', label: 'Avatar', icon: Smile }
  ];

  return (
    <div className={`flex h-screen antialiased text-gray-800 ${settings.darkMode ? 'dark' : ''}`}>
      <div className="flex flex-row w-full overflow-x-hidden">
        {/* Sidebar */}
        <div className="flex flex-col w-64 bg-gray-50 border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">📋 Tasky</h1>
            <button
              onClick={handleCloseApp}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Close Tasky"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex-grow p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon size={20} className="mr-3" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full p-6 overflow-y-auto bg-white dark:bg-gray-800">
          <AnimatePresence mode="wait">
            {activeTab === 'reminders' && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RemindersTab 
                  reminders={reminders}
                  onAddReminder={handleAddReminder}
                  onRemoveReminder={handleRemoveReminder}
                  onEditReminder={handleEditReminder}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsTab 
                  settings={settings}
                  onSettingChange={handleSettingChange}
                  onTestNotification={handleTestNotification}
                />
              </motion.div>
            )}

            {activeTab === 'avatar' && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AvatarTab 
                  selectedAvatar={settings.selectedAvatar}
                  onAvatarChange={handleAvatarChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// Reminders Tab Component
const RemindersTab = ({ reminders, onAddReminder, onRemoveReminder, onEditReminder }) => {
  const [editingReminder, setEditingReminder] = useState(null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reminders</h2>
      
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Add New Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <ReminderForm 
            onAddReminder={onAddReminder}
            onEditReminder={onEditReminder}
            editingReminder={editingReminder}
            onCancelEdit={() => setEditingReminder(null)}
          />
        </CardContent>
      </Card>

      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Your Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No reminders set up yet. Add one above to get started!</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                onRemove={() => onRemoveReminder(reminder.id)}
                onEdit={() => setEditingReminder(reminder)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ settings, onSettingChange, onTestNotification }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>

      <SettingSection title="Notifications & Alerts" icon="🔔">
        <SettingItem
          icon="🔔"
          title="Enable Notifications"
          description="Receive desktop notifications for your reminders"
          type="switch"
          value={settings.enableNotifications}
          onChange={(checked) => onSettingChange('enableNotifications', checked)}
        />
        <SettingItem
          icon="🔊"
          title="Sound Alerts"
          description="Play notification sounds when reminders trigger"
          type="switch"
          value={settings.enableSound}
          onChange={(checked) => onSettingChange('enableSound', checked)}
        />
        <SettingItem
          icon="💬"
          title="Notification Position"
          type="select"
          value={settings.notificationType}
          onChange={(value) => onSettingChange('notificationType', value)}
          options={[
            { value: 'custom', label: '⬅️ Left Side' },
            { value: 'native', label: '➡️ Right Side' }
          ]}
        />
      </SettingSection>

      <SettingSection title="Desktop Assistant" icon="🤖">
        <SettingItem
          icon="🤖"
          title="Desktop Companion"
          description="Show your assistant on the desktop for notifications"
          type="switch"
          value={settings.enableAssistant}
          onChange={(checked) => onSettingChange('enableAssistant', checked)}
        />
        <SettingItem
          icon="✨"
          title="Assistant Animations"
          description="Enable bouncing and hover animations for your companion"
          type="switch"
          value={settings.enableAnimation}
          onChange={(checked) => onSettingChange('enableAnimation', checked)}
        />
      </SettingSection>

      <SettingSection title="System & Appearance" icon="⚙️">
        <SettingItem
          icon="⚡"
          title="Auto Start"
          description="Launch Tasky automatically when Windows starts"
          type="switch"
          value={settings.autoStart}
          onChange={(checked) => onSettingChange('autoStart', checked)}
        />
        <SettingItem
          icon="🌙"
          title="Dark Mode"
          description="Switch to a dark color scheme for better visibility"
          type="switch"
          value={settings.darkMode}
          onChange={(checked) => onSettingChange('darkMode', checked)}
        />
      </SettingSection>
      
      <Button 
        className="w-full mt-6"
        onClick={onTestNotification}
      >
        Test Notification
      </Button>
    </div>
  );
};

// Avatar Tab Component
const AvatarTab = ({ selectedAvatar, onAvatarChange }) => {
  const avatars = [
    { name: 'Clippy', label: '📎 Clippy', description: 'The classic office assistant' },
    { name: 'Merlin', label: '🧙‍♂️ Merlin', description: 'The wise wizard companion' },
    { name: 'Rover', label: '🐕 Rover', description: 'Your loyal dog friend' },
    { name: 'Genie', label: '🧞‍♂️ Genie', description: 'The magical helper' },
    { name: 'Rocky', label: '🗿 Rocky', description: 'The solid stone companion' },
    { name: 'Bonzi', label: '🐵 Bonzi', description: 'The playful monkey' },
    { name: 'Peedy', label: '🦜 Peedy', description: 'The colorful parrot' },
    { name: 'Links', label: '⛳ Links', description: 'The golf-loving cat' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Choose Your Assistant</h2>
      
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Available Assistants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {avatars.map((avatar) => (
              <Card 
                key={avatar.name}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                  selectedAvatar === avatar.name 
                    ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-white' 
                    : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                }`}
                onClick={() => onAvatarChange(avatar.name)}
              >
                <CardContent className="flex flex-col items-center text-center p-4">
                  <div className="text-3xl mb-2">{avatar.label.split(' ')[0]}</div>
                  <div className="font-medium text-sm mb-1">
                    {avatar.label.split(' ').slice(1).join(' ')}
                  </div>
                  <div className={`text-xs ${
                    selectedAvatar === avatar.name ? 'text-blue-500 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {avatar.description}
                  </div>
                  {selectedAvatar === avatar.name && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ReminderForm = ({ onAddReminder, onEditReminder, editingReminder, onCancelEdit }) => {
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('09:00');
  const [days, setDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  // Populate form when editing
  useEffect(() => {
    if (editingReminder) {
      setMessage(editingReminder.message);
      setTime(editingReminder.time);
      const dayObj = {};
      Object.keys(days).forEach(day => {
        dayObj[day] = editingReminder.days.includes(day);
      });
      setDays(dayObj);
    }
  }, [editingReminder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      alert('Please enter a reminder message');
      return;
    }

    const selectedDays = Object.keys(days).filter(day => days[day]);
    if (selectedDays.length === 0) {
      alert('Please select at least one day');
      return;
    }

    const reminder = {
      message: message.trim(),
      time,
      days: selectedDays,
      enabled: true,
    };

    if (editingReminder) {
      onEditReminder(editingReminder.id, reminder);
      onCancelEdit();
    } else {
      onAddReminder(reminder);
    }
    
    setMessage('');
    setTime('09:00');
    setDays({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    });
  };

  const handleDayChange = (day) => {
    setDays({ ...days, [day]: !days[day] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {editingReminder && (
        <div className="flex items-center justify-between mb-4 p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">Edit Reminder</span>
          </div>
          <Button type="button" onClick={onCancelEdit} variant="destructive" size="sm">
            Cancel
          </Button>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">Reminder message</Label>
        <Input
          id="message"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Time to stand up and stretch!"
          maxLength={100}
          className="bg-white dark:bg-gray-800"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time" className="text-gray-700 dark:text-gray-300">Time</Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-white dark:bg-gray-800"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700 dark:text-gray-300">Days</Label>
        <div className="grid grid-cols-4 gap-2">
          {Object.keys(days).map(day => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={days[day]}
                onCheckedChange={() => handleDayChange(day)}
              />
              <Label
                htmlFor={day}
                className="text-sm font-normal cursor-pointer text-gray-600 dark:text-gray-400"
              >
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
      >
        {editingReminder ? "Update Reminder" : "Add Reminder"}
      </Button>
    </form>
  );
};

const ReminderItem = ({ reminder, onRemove, onEdit }) => {
  const formatDays = (days) => {
    const dayNames = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    
    return days.map(day => dayNames[day]).join(', ');
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="font-medium text-gray-800 dark:text-white mb-1">
            {reminder.message}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            🕐 {reminder.time} • 📅 {formatDays(reminder.days)}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            variant="outline"
            size="icon"
            onClick={onEdit} 
            title="Edit reminder"
            className="w-8 h-8"
          >
            ✏️
          </Button>
          <Button 
            variant="destructive"
            size="icon"
            onClick={onRemove} 
            title="Remove reminder"
            className="w-8 h-8"
          >
            🗑️
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default App;
