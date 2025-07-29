import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingSection } from '../components/SettingSection';
import { SettingItem } from '../components/SettingItem';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Bell, Settings, Smile, X, Plus, Edit3, Trash2, Clock, Calendar } from 'lucide-react';

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
    <div className={`flex flex-col h-screen font-sans antialiased ${settings.darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col w-full overflow-hidden bg-background text-foreground">
        {/* Header with Tabs */}
        <header className="flex-shrink-0 bg-card border-b border-border header shadow-lg">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-3">
            </div>
            
            {/* Top Navigation Tabs */}
            <nav className="flex items-center gap-2 top-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 top-nav-btn ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105 active'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 hover:scale-102'
                  }`}
                >
                  <tab.icon size={16} className={`mr-2 transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      className="ml-2 w-1 h-1 rounded-full bg-primary-foreground"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            <button
              onClick={handleCloseApp}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-all duration-200 hover:scale-105"
              title="Close Tasky"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          <div className="h-full p-8 pb-10">
            <AnimatePresence mode="wait">
              {activeTab === 'reminders' && (
                <motion.div
                  key="reminders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <AvatarTab 
                    selectedAvatar={settings.selectedAvatar}
                    onAvatarChange={handleAvatarChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

// Reminders Tab Component
const RemindersTab = ({ reminders, onAddReminder, onRemoveReminder, onEditReminder }) => {
  const [editingReminder, setEditingReminder] = useState(null);

  return (
    <div className="space-y-8 h-full">
      
      <Card className="bg-card border-border/30 shadow-2xl rounded-3xl card backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
              <Plus size={20} className="text-card-foreground" />
            </div>
            Add New Reminder
          </CardTitle>
        </CardHeader>
        <CardContent className="text-card-foreground">
          <ReminderForm 
            onAddReminder={onAddReminder}
            onEditReminder={onEditReminder}
            editingReminder={editingReminder}
            onCancelEdit={() => setEditingReminder(null)}
          />
        </CardContent>
      </Card>

      <div className="pb-6">
        <Card className="bg-card border-border/30 shadow-2xl flex-1 card rounded-3xl backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
                <Calendar size={20} className="text-card-foreground" />
              </div>
              Your Reminders
              {reminders.length > 0 && (
                <span className="ml-auto text-xs px-3 py-1.5 bg-secondary/20 text-secondary-foreground rounded-2xl font-semibold">
                  {reminders.length} active
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Bell size={24} className="text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No reminders yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create your first reminder above to get started with your productivity journey!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {reminders.map((reminder, index) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ReminderItem
                      reminder={reminder}
                      onRemove={() => onRemoveReminder(reminder.id)}
                      onEdit={() => setEditingReminder(reminder)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ settings, onSettingChange, onTestNotification }) => {
  return (
    <div className="space-y-8 h-full">
      <div className="space-y-8">
        <Card className="bg-card border-border/30 shadow-2xl card rounded-3xl backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
                <Settings size={20} className="text-card-foreground" />
              </div>
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
            
            <div className="pt-6 border-t border-border/30">
              <Button 
                className="w-full bg-card hover:bg-secondary/90 text-card-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl py-3 font-semibold"
                onClick={onTestNotification}
              >
                <Bell size={18} className="mr-3" />
                Test Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <div className="space-y-8 h-full">
      
      <Card className="bg-card border-border/30 shadow-2xl card rounded-3xl backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
              <Smile size={20} className="text-card-foreground" />
            </div>
            Available Assistants
            <span className="ml-auto text-xs px-3 py-1.5 bg-secondary/20 text-secondary-foreground rounded-2xl font-semibold">
              {avatars.length} companions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {avatars.map((avatar, index) => (
              <motion.div
                key={avatar.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 relative overflow-hidden rounded-2xl ${
                    selectedAvatar === avatar.name 
                      ? 'ring-3 ring-primary/50 bg-primary/5 border-primary/30 shadow-xl' 
                      : 'bg-card hover:bg-secondary/10 border-border/30 shadow-lg'
                  }`}
                  onClick={() => onAvatarChange(avatar.name)}
                >
                  <CardContent className="flex flex-col items-center text-center p-6 relative h-32">
                    <div className={`relative text-4xl mb-3 transition-transform duration-300 ${
                      selectedAvatar === avatar.name ? 'scale-110' : 'group-hover:scale-105 group-hover:animate-bounce-subtle'
                    }`}>
                      {avatar.label.split(' ')[0]}
                      {selectedAvatar === avatar.name && (
                        <motion.div 
                          className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.3 }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>
                    <div className="font-medium text-base mb-1 text-foreground">
                      {avatar.label.split(' ').slice(1).join(' ')}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed flex-1 flex items-center">
                      {avatar.description}
                    </div>
                    
                    {selectedAvatar === avatar.name && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {editingReminder && (
        <motion.div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20">
              <Edit3 size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="font-medium text-amber-800 dark:text-amber-200">Editing Reminder</span>
          </div>
          <Button 
            type="button" 
            onClick={onCancelEdit} 
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl py-2 px-4 font-semibold"
          >
            Cancel
          </Button>
        </motion.div>
      )}
      
      <div className="space-y-3">
        <Label htmlFor="message" className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <span className="text-lg">💬</span>
          Reminder message
        </Label>
        <Input
          id="message"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Time to stand up and stretch!"
          maxLength={100}
          className="bg-background border-border/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 input rounded-xl py-3 text-base"
        />
        <div className="text-xs text-muted-foreground text-right">
          {message.length}/100 characters
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="time" className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Clock size={16} />
          Time
        </Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-background border-border/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 input rounded-xl py-3 text-base"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Calendar size={16} />
          Days of the week
        </Label>
        <div className="grid grid-cols-4 gap-3">
          {Object.keys(days).map(day => (
            <div key={day} className="flex items-center space-x-2 p-3 rounded-xl hover:bg-secondary/10 transition-all duration-200 hover:scale-105">
              <Checkbox
                id={day}
                checked={days[day]}
                onCheckedChange={() => handleDayChange(day)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg"
              />
              <Label
                htmlFor={day}
                className="text-sm font-normal cursor-pointer text-card-foreground flex-1"
              >
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-card hover:bg-secondary/90 text-card-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl py-3 font-semibold"
      >
        <Plus size={18} className="mr-3" />
        {editingReminder ? "Update Reminder" : "Add Reminder"}
      </Button>
    </form>
  );
};

const ReminderItem = ({ reminder, onRemove, onEdit }) => {
  const formatDays = (days) => {
    const dayNames = {
      monday: 'M',
      tuesday: 'T',
      wednesday: 'W',
      thursday: 'T',
      friday: 'F',
      saturday: 'S',
      sunday: 'S'
    };
    
    // Handle weekdays specially
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekends = ['saturday', 'sunday'];
    
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && weekdays.every(day => days.includes(day))) return 'Weekdays';
    if (days.length === 2 && weekends.every(day => days.includes(day))) return 'Weekends';
    
    return days.map(day => dayNames[day]).join('');
  };

  return (
    <Card className="group bg-card border-border/30 shadow-lg hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 shrink-0">
            <Bell size={18} className="text-card-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground mb-2 line-clamp-2">
              {reminder.message}
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{reminder.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDays(reminder.days)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button 
              onClick={onEdit} 
              title="Edit reminder"
              className="bg-card hover:bg-secondary/90 text-card-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl py-2 px-3 font-semibold text-sm"
            >
              <Edit3 size={14} className="mr-1" />
              Edit
            </Button>
            <Button 
              onClick={onRemove} 
              title="Remove reminder"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl py-2 px-3 font-semibold text-sm"
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default App;
