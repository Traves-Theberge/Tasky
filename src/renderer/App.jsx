import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingSection } from '../components/SettingSection';
import { SettingItem } from '../components/SettingItem';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import CustomSwitch from '../components/ui/CustomSwitch';
import { Bell, Settings, Smile, X, Plus, Edit3, Trash2, Clock, Calendar, Minus, Paperclip } from 'lucide-react';

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
    enableAnimation: true,
    timeFormat: '24', // '12' or '24'
    enableDragging: true, // false = click-through, true = draggable
    assistantLayer: 'above', // 'above' = above windows, 'below' = below windows
    bubbleSide: 'left', // 'left' or 'right' bubble position
  });

  useEffect(() => {
    // Load initial data when component mounts
    loadReminders();
    loadSettings();
  }, []);

  const loadReminders = async () => {
    try {
      const savedReminders = await window.electronAPI.getReminders();
      // Ensure all reminders have an enabled property (default to true for backwards compatibility)
      const remindersWithEnabled = (savedReminders || []).map(reminder => ({
        ...reminder,
        enabled: reminder.enabled !== undefined ? reminder.enabled : true
      }));
      setReminders(remindersWithEnabled);
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
      const timeFormat = await window.electronAPI.getSetting('timeFormat');
      const enableDragging = await window.electronAPI.getSetting('enableDragging');
      const assistantLayer = await window.electronAPI.getSetting('assistantLayer');
      const bubbleSide = await window.electronAPI.getSetting('bubbleSide');
      
      setSettings({
        enableSound: enableSound !== undefined ? enableSound : true,
        enableAssistant: enableAssistant !== undefined ? enableAssistant : true,
        enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
        autoStart: autoStart !== undefined ? autoStart : false,
        notificationType: notificationType !== undefined ? notificationType : 'custom',
        selectedAvatar: selectedAvatar !== undefined ? selectedAvatar : 'Clippy',
        enableAnimation: await window.electronAPI.getSetting('enableAnimation') !== undefined ? await window.electronAPI.getSetting('enableAnimation') : true,
        timeFormat: timeFormat !== undefined ? timeFormat : '24',
        enableDragging: enableDragging !== undefined ? enableDragging : true,
        assistantLayer: assistantLayer !== undefined ? assistantLayer : 'above',
        bubbleSide: bubbleSide !== undefined ? bubbleSide : 'left',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleAddReminder = (reminder) => {
    const newReminder = {
      id: Date.now().toString(),
      enabled: true, // Default to enabled
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

  const handleToggleReminder = (id, enabled) => {
    console.log('Toggling reminder:', id, 'to enabled:', enabled);
    const updatedReminder = reminders.find(r => r.id === id);
    if (updatedReminder) {
      const newReminder = { ...updatedReminder, enabled };
      console.log('Updated reminder:', newReminder);
      window.electronAPI.updateReminder(id, newReminder);
      setReminders(reminders.map(reminder => 
        reminder.id === id ? newReminder : reminder
      ));
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    window.electronAPI.setSetting(key, value);
    
    if (key === 'enableNotifications') {
      window.electronAPI.toggleReminders(value);
    }
    
    if (key === 'enableDragging') {
      window.electronAPI.toggleAssistantDragging(value);
    }
    
    if (key === 'assistantLayer') {
      window.electronAPI.setAssistantLayer(value);
    }
    
    if (key === 'bubbleSide') {
      window.electronAPI.setBubbleSide(value);
    }
  };

  const handleTestNotification = () => {
    window.electronAPI.testNotification();
  };

  const handleAvatarChange = async (avatar) => {
    const newSettings = { ...settings, selectedAvatar: avatar };
    setSettings(newSettings);
    window.electronAPI.setSetting('selectedAvatar', avatar);
    
    // If it's a custom avatar, get the file path
    if (avatar.startsWith('custom_')) {
      const customAvatars = await window.electronAPI.getSetting('customAvatars');
      if (customAvatars && Array.isArray(customAvatars)) {
        const customAvatar = customAvatars.find(a => a.name === avatar);
        if (customAvatar) {
          window.electronAPI.setSetting('customAvatarPath', customAvatar.filePath);
        }
      }
    }
    
    window.electronAPI.changeAvatar(avatar);
  };

  const handleCloseApp = () => {
    window.electronAPI.closeWindow();
  };

  const handleMinimizeApp = () => {
    window.electronAPI.minimizeWindow();
  };

  const tabs = [
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'avatar', label: 'Avatar', icon: Smile },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex flex-col h-screen font-sans antialiased dark">
      <div className="flex flex-col w-full overflow-hidden bg-background text-foreground">
        {/* Header with Tabs */}
        <header className="flex-shrink-0 bg-background border-b-0 header sticky top-0 z-50" style={{WebkitAppRegion: 'drag'}}>
          <div className="flex flex-col h-20">
            {/* Window Controls */}
            <div className="flex justify-end items-center h-8 pr-0">
              <div className="flex items-center" style={{WebkitAppRegion: 'no-drag'}}>
                <button
                  onClick={handleMinimizeApp}
                  className="flex items-center justify-center w-12 h-8 hover:bg-gray-600 hover:text-white transition-all duration-200 border-none outline-none"
                  title="Minimize"
                >
                  <Minus size={14} className="text-muted-foreground hover:text-white" />
                </button>
                <button
                  onClick={handleCloseApp}
                  className="flex items-center justify-center w-12 h-8 hover:bg-red-600 hover:text-white transition-all duration-200 border-none outline-none"
                  title="Close"
                >
                  <span className="text-muted-foreground hover:text-white text-sm font-bold">✕</span>
                </button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex justify-center items-center h-12 px-6">
              <nav className="flex items-center gap-2 top-nav" style={{WebkitAppRegion: 'no-drag'}}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center px-4 py-1.5 text-sm font-semibold rounded-xl transition-all duration-300 top-nav-btn ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105 active'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 hover:scale-102'
                    }`}
                  >
                    <tab.icon size={14} className={`mr-2 transition-transform duration-200 ${
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
            </div>
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
                    onToggleReminder={handleToggleReminder}
                    timeFormat={settings.timeFormat}
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
const RemindersTab = ({ reminders, onAddReminder, onRemoveReminder, onEditReminder, onToggleReminder, timeFormat }) => {
  const [editingReminder, setEditingReminder] = useState(null);

  return (
    <div className="space-y-8 h-full">
      
      <Card className="bg-card border-border/30 shadow-2xl rounded-3xl card backdrop-blur-sm">
        <CardHeader className="pb-6">
        </CardHeader>
        <CardContent className="text-card-foreground">
          <ReminderForm 
            onAddReminder={onAddReminder}
            onEditReminder={onEditReminder}
            editingReminder={editingReminder}
            onCancelEdit={() => setEditingReminder(null)}
            timeFormat={timeFormat}
          />
        </CardContent>
      </Card>

      <div className="pb-6 h-full">
        <Card className="bg-card border-border/30 shadow-2xl flex-1 card rounded-3xl backdrop-blur-sm h-full">
          <CardHeader className="pb-4 border-b border-border/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Calendar size={20} className="text-primary" />
                </div>
                Your Reminders
              </CardTitle>
              {reminders.length > 0 && (
                <span className="text-xs px-3 py-1.5 bg-secondary/20 text-secondary-foreground rounded-xl font-medium">
                  {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 h-full">
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Bell size={32} className="text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Plus size={14} className="text-yellow-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">No reminders set</h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Create your first reminder above to start building your productivity habits!
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-4 max-h-96 overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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
                        onToggle={(enabled) => onToggleReminder(reminder.id, enabled)}
                        timeFormat={timeFormat}
                      />
                    </motion.div>
                  ))}
                </div>
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
            <SettingSection title="Notifications & Alerts">
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
            </SettingSection>

            <SettingSection title="Desktop Avatar">
              <SettingItem
                icon="🤖"
                title="Desktop Companion"
                description="Show/Hide your Avatar "
                type="switch"
                value={settings.enableAssistant}
                onChange={(checked) => onSettingChange('enableAssistant', checked)}
              />
              <SettingItem
                icon="🔓"
                title="Enable Dragging"
                description="Allow dragging the assistant"
                type="switch"
                value={settings.enableDragging}
                onChange={(checked) => onSettingChange('enableDragging', checked)}
                options={[
                  { label: 'OFF' },
                  { label: 'ON' }
                ]}
              />
              <SettingItem
                icon="✨"
                title="Avatar Animations"
                description="Enable bouncing and hover animations for your companion"
                type="switch"
                value={settings.enableAnimation}
                onChange={(checked) => onSettingChange('enableAnimation', checked)}
              />
              <SettingItem
                icon="📌"
                title="Desktop Layer"
                description="Pin Avatar above or below other windows"
                type="switch"
                value={settings.assistantLayer === 'below'}
                onChange={(checked) => onSettingChange('assistantLayer', checked ? 'below' : 'above')}
                options={[
                  { label: 'Above' },
                  { label: 'Below' }
                ]}
              />
              <SettingItem
                icon="💬"
                title="Notification Position"
                description="Choose which side notification bubbles appear on"
                type="switch"
                value={settings.bubbleSide === 'right'}
                onChange={(checked) => onSettingChange('bubbleSide', checked ? 'right' : 'left')}
                options={[
                  { label: 'Left' },
                  { label: 'Right' }
                ]}
              />
            </SettingSection>

            <SettingSection title="System">
              <SettingItem
                icon="⚡"
                title="Auto Start"
                description="Launch Tasky automatically when Windows starts"
                type="switch"
                value={settings.autoStart}
                onChange={(checked) => onSettingChange('autoStart', checked)}
              />
              <SettingItem
                icon="🕐"
                title="Time Format"
                description="Choose between 12-hour and 24-hour time display"
                type="switch"
                value={settings.timeFormat === '24'}
                onChange={(checked) => onSettingChange('timeFormat', checked ? '24' : '12')}
                options={[
                  { label: '12h' },
                  { label: '24h' }
                ]}
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
  const [customAvatars, setCustomAvatars] = useState([]);
  const [avatarDataUrls, setAvatarDataUrls] = useState({});

  const defaultAvatars = [
    { name: 'Clippy', label: '📎 Clippy', description: 'The classic', type: 'default' },
    { name: 'Merlin', label: '🧙‍♂️ Merlin', description: 'The wise wizard', type: 'default' },
    { name: 'Rover', label: '🐕 Rover', description: 'Your loyal dog friend', type: 'default' },
    { name: 'Genie', label: '🧞‍♂️ Genie', description: 'The magical helper', type: 'default' },
    { name: 'Rocky', label: '🗿 Rocky', description: 'The solid stone', type: 'default' },
    { name: 'Bonzi', label: '🐵 Bonzi', description: 'The playful monkey', type: 'default' },
    { name: 'Peedy', label: '🦜 Peedy', description: 'The colorful parrot', type: 'default' },
    { name: 'Links', label: '⛳ Links', description: 'The golf-loving cat', type: 'default' }
  ];

  // Load custom avatars on component mount
  useEffect(() => {
    loadCustomAvatars();
  }, []);

  const loadCustomAvatars = async () => {
    try {
      const savedCustomAvatars = await window.electronAPI.getSetting('customAvatars');
      if (savedCustomAvatars && Array.isArray(savedCustomAvatars)) {
        // Clean up old descriptions and ensure consistent format
        const cleanedAvatars = savedCustomAvatars.map(avatar => ({
          ...avatar,
          description: avatar.description === 'Custom uploaded image' ? '' : (avatar.description || '')
        }));
        setCustomAvatars(cleanedAvatars);
        
        // Load data URLs for all custom avatars
        const dataUrlPromises = cleanedAvatars.map(async (avatar) => {
          if (avatar.filePath) {
            const dataUrl = await window.electronAPI.getAvatarDataUrl(avatar.filePath);
            return { name: avatar.name, dataUrl };
          }
          return { name: avatar.name, dataUrl: null };
        });
        
        const dataUrlResults = await Promise.all(dataUrlPromises);
        const newDataUrls = {};
        dataUrlResults.forEach(result => {
          if (result.dataUrl) {
            newDataUrls[result.name] = result.dataUrl;
          }
        });
        setAvatarDataUrls(newDataUrls);
        
        // Save the cleaned version back to storage
        if (JSON.stringify(cleanedAvatars) !== JSON.stringify(savedCustomAvatars)) {
          window.electronAPI.setSetting('customAvatars', cleanedAvatars);
        }
      }
    } catch (error) {
      console.error('Failed to load custom avatars:', error);
    }
  };

  const handleCustomAvatarUpload = async () => {
    try {
      const filePath = await window.electronAPI.selectAvatarFile();
      if (filePath) {
        // Create a unique name for the custom avatar
        const fileName = filePath.split('/').pop().split('\\').pop();
        const cleanName = fileName.split('.')[0]; // Remove file extension
        const avatarName = `custom_${Date.now()}`;
        const newCustomAvatar = {
          name: avatarName,
          label: cleanName, // Just the clean filename without emoji or extension
          description: '', // Remove the "Custom uploaded image" text
          type: 'custom',
          filePath: filePath
        };
        
        const updatedCustomAvatars = [...customAvatars, newCustomAvatar];
        setCustomAvatars(updatedCustomAvatars);
        
        // Load data URL for the new avatar
        const dataUrl = await window.electronAPI.getAvatarDataUrl(filePath);
        if (dataUrl) {
          setAvatarDataUrls(prev => ({
            ...prev,
            [avatarName]: dataUrl
          }));
        }
        
        // Save custom avatars list
        window.electronAPI.setSetting('customAvatars', updatedCustomAvatars);
        
        // Set as selected avatar
        onAvatarChange(avatarName);
        window.electronAPI.setSetting('customAvatarPath', filePath);
      }
    } catch (error) {
      console.error('Failed to upload custom avatar:', error);
    }
  };

  const handleDeleteCustomAvatar = async (avatarName) => {
    const updatedCustomAvatars = customAvatars.filter(avatar => avatar.name !== avatarName);
    setCustomAvatars(updatedCustomAvatars);
    
    // Save updated list
    window.electronAPI.setSetting('customAvatars', updatedCustomAvatars);
    
    // If the deleted avatar was selected, switch to Clippy
    if (selectedAvatar === avatarName) {
      onAvatarChange('Clippy');
    }
  };

  // Combine default and custom avatars
  const allAvatars = [...defaultAvatars, ...customAvatars];

  return (
    <div className="space-y-8 h-full">
      
      <Card className="bg-card border-border/30 shadow-2xl card rounded-3xl backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
            Available Assistants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Default Avatars */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Default Companions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {defaultAvatars.map((avatar, index) => (
                  <motion.div
                    key={avatar.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden rounded-2xl ${
                        selectedAvatar === avatar.name 
                          ? 'ring-2 ring-primary/50 bg-primary/5 border-primary/30 shadow-lg' 
                          : 'bg-card hover:bg-secondary/10 border-border/30 shadow-md'
                      }`}
                      onClick={() => onAvatarChange(avatar.name)}
                    >
                      <CardContent className="flex flex-col items-center text-center p-4 relative h-28">
                        <div className={`relative text-3xl mb-2 transition-transform duration-300 ${
                          selectedAvatar === avatar.name ? 'scale-110' : 'group-hover:scale-105'
                        }`}>
                          {avatar.label.split(' ')[0]}
                          {selectedAvatar === avatar.name && (
                            <motion.div 
                              className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", duration: 0.3 }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </div>
                        <div className="font-medium text-sm mb-1 text-foreground">
                          {avatar.label.split(' ').slice(1).join(' ')}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed flex-1 flex items-center">
                          {avatar.description}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Custom Avatars */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Custom Avatars
                </h3>
              </div>
              
              {customAvatars.length === 0 ? (
                <div className="py-4">
                  <Button
                    onClick={handleCustomAvatarUpload}
                    className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    Upload Avatar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={handleCustomAvatarUpload}
                      className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                      <Plus size={14} className="mr-2" />
                      Add More
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {customAvatars.map((avatar, index) => (
                    <motion.div
                      key={avatar.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card 
                        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden rounded-2xl ${
                          selectedAvatar === avatar.name 
                            ? 'ring-2 ring-primary/50 bg-primary/5 border-primary/30 shadow-lg' 
                            : 'bg-card hover:bg-secondary/10 border-border/30 shadow-md'
                        }`}
                        onClick={async () => {
                          console.log('Selecting custom avatar:', avatar.name, 'with path:', avatar.filePath);
                          // Set the custom avatar path FIRST
                          await window.electronAPI.setSetting('customAvatarPath', avatar.filePath);
                          // Then change the avatar
                          onAvatarChange(avatar.name);
                        }}
                      >
                        <CardContent className="flex flex-col items-center text-center p-4 relative h-28">
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomAvatar(avatar.name);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Delete custom avatar"
                          >
                            <X size={10} />
                          </button>
                          
                          <div className={`relative text-3xl mb-2 transition-transform duration-300 ${
                            selectedAvatar === avatar.name ? 'scale-110' : 'group-hover:scale-105'
                          }`}>
                            <img 
                              src={avatarDataUrls[avatar.name] || ''}
                              alt={avatar.label}
                              className="w-12 h-12 object-cover rounded-lg"
                              onLoad={() => {
                                console.log('✅ Custom avatar preview loaded successfully:', avatar.filePath);
                              }}
                              onError={(e) => {
                                console.error('❌ Custom avatar failed to load, trying alternatives for:', avatar.filePath);
                                const originalPath = avatar.filePath;
                                const attempts = [
                                  originalPath.replace(/\\/g, '/'),
                                  `file:///${originalPath.replace(/\\/g, '/')}`,
                                  `file://${originalPath.replace(/\\/g, '/')}`,
                                  originalPath
                                ];
                                
                                const currentAttempt = parseInt(e.target.dataset.attempt || '0');
                                if (currentAttempt < attempts.length - 1) {
                                  const nextAttempt = currentAttempt + 1;
                                  e.target.dataset.attempt = nextAttempt.toString();
                                  e.target.src = attempts[nextAttempt];
                                  console.log(`Trying attempt ${nextAttempt}:`, attempts[nextAttempt]);
                                } else {
                                  console.error('All attempts failed, showing error placeholder');
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'block';
                                }
                              }}
                            />
                            <div style={{ display: 'none' }} className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                              {avatar.label.charAt(0).toUpperCase()}
                            </div>
                            {selectedAvatar === avatar.name && (
                              <motion.div 
                                className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.3 }}
                              >
                                ✓
                              </motion.div>
                            )}
                          </div>
                          <div className="font-medium text-sm mb-1 text-muted-foreground truncate w-full">
                            {avatar.label}
                          </div>
                          {avatar.description && avatar.description !== 'Custom uploaded image' && (
                            <div className="text-xs text-muted-foreground leading-relaxed flex-1 flex items-center">
                              {avatar.description}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                    ))}
                  </div>
                  <div className="text-center mt-6">
                    <p className="text-xs text-muted-foreground/70">
                      JPG, PNG, GIF, BMP, WebP • 128x128px+
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ReminderForm = ({ onAddReminder, onEditReminder, editingReminder, onCancelEdit, timeFormat }) => {
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

  // Helper functions for time format conversion
  const formatTimeFor12Hour = (hour24) => {
    const hour = parseInt(hour24);
    if (hour === 0) return '12';
    if (hour <= 12) return hour.toString();
    return (hour - 12).toString();
  };

  const getAmPm = (hour24) => {
    return parseInt(hour24) < 12 ? 'AM' : 'PM';
  };

  const convertTo24Hour = (hour12, ampm) => {
    let hour = parseInt(hour12);
    if (ampm === 'AM' && hour === 12) hour = 0;
    if (ampm === 'PM' && hour !== 12) hour += 12;
    return hour.toString().padStart(2, '0');
  };

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
          Add New Reminder
        </Label>
        <input
          id="message"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Time to stand up and stretch!"
          maxLength={100}
          className="w-full bg-card text-card-foreground border border-border/30 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl placeholder:text-muted-foreground"
          style={{
            backgroundColor: '#464647',
            color: '#ffffff'
          }}
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
        {timeFormat === '24' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Hour</label>
              <select
                value={time.split(':')[0]}
                onChange={(e) => setTime(`${e.target.value}:${time.split(':')[1]}`)}
                className="w-full bg-card text-card-foreground border border-border/30 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#464647',
                  color: '#ffffff'
                }}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={hour} value={hour} style={{ backgroundColor: '#464647', color: '#ffffff' }}>
                      {hour}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Minute</label>
              <select
                value={time.split(':')[1]}
                onChange={(e) => setTime(`${time.split(':')[0]}:${e.target.value}`)}
                className="w-full bg-card text-card-foreground border border-border/30 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#464647',
                  color: '#ffffff'
                }}
              >
                {Array.from({ length: 60 }, (_, i) => {
                  const minute = i.toString().padStart(2, '0');
                  return (
                    <option key={minute} value={minute} style={{ backgroundColor: '#464647', color: '#ffffff' }}>
                      {minute}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Hour</label>
              <select
                value={formatTimeFor12Hour(time.split(':')[0])}
                onChange={(e) => {
                  const currentAmPm = getAmPm(time.split(':')[0]);
                  const new24Hour = convertTo24Hour(e.target.value, currentAmPm);
                  setTime(`${new24Hour}:${time.split(':')[1]}`);
                }}
                className="w-full bg-card text-card-foreground border border-border/30 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#464647',
                  color: '#ffffff'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = (i + 1).toString();
                  return (
                    <option key={hour} value={hour} style={{ backgroundColor: '#464647', color: '#ffffff' }}>
                      {hour}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Minute</label>
              <select
                value={time.split(':')[1]}
                onChange={(e) => setTime(`${time.split(':')[0]}:${e.target.value}`)}
                className="w-full bg-card text-card-foreground border border-border/30 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#464647',
                  color: '#ffffff'
                }}
              >
                {Array.from({ length: 60 }, (_, i) => {
                  const minute = i.toString().padStart(2, '0');
                  return (
                    <option key={minute} value={minute} style={{ backgroundColor: '#464647', color: '#ffffff' }}>
                      {minute}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">AM/PM</label>
              <select
                value={getAmPm(time.split(':')[0])}
                onChange={(e) => {
                  const currentHour12 = formatTimeFor12Hour(time.split(':')[0]);
                  const new24Hour = convertTo24Hour(currentHour12, e.target.value);
                  setTime(`${new24Hour}:${time.split(':')[1]}`);
                }}
                className="w-full bg-card text-card-foreground border border-border/30 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#464647',
                  color: '#ffffff'
                }}
              >
                <option value="AM" style={{ backgroundColor: '#464647', color: '#ffffff' }}>AM</option>
                <option value="PM" style={{ backgroundColor: '#464647', color: '#ffffff' }}>PM</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Calendar size={16} />
          Days of the week
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(days).map(day => (
            <div key={day} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/10 transition-all duration-200 hover:scale-105">
              <Label
                htmlFor={day}
                className="text-sm font-medium cursor-pointer text-card-foreground"
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Label>
              <CustomSwitch
                checked={days[day]}
                onChange={() => handleDayChange(day)}
              />
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

const ReminderItem = ({ reminder, onRemove, onEdit, onToggle, timeFormat }) => {
  const formatTimeDisplay = (time24) => {
    if (timeFormat === '24') {
      return time24;
    } else {
      const [hour, minute] = time24.split(':');
      const hour24 = parseInt(hour);
      let hour12 = hour24;
      let ampm = 'AM';
      
      if (hour24 === 0) {
        hour12 = 12;
      } else if (hour24 > 12) {
        hour12 = hour24 - 12;
        ampm = 'PM';
      } else if (hour24 === 12) {
        ampm = 'PM';
      }
      
      return `${hour12}:${minute} ${ampm}`;
    }
  };

  const formatDays = (days) => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekends = ['saturday', 'sunday'];
    
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && weekdays.every(day => days.includes(day))) return 'Weekdays';
    if (days.length === 2 && weekends.every(day => days.includes(day))) return 'Weekends';
    
    return days.length + ' days';
  };

  const isEnabled = reminder.enabled !== false;

  const handleToggleChange = (checked) => {
    console.log('Toggle changed to:', checked, 'for reminder:', reminder.id);
    onToggle(checked);
  };

  return (
    <div className={`bg-secondary/30 border-2 border-border/40 rounded-lg p-4 space-y-3 transition-opacity duration-200 hover:bg-secondary/40 hover:border-border/60 ${!isEnabled ? 'opacity-60' : ''}`}>
      {/* Reminder message and toggle */}
      <div className="flex items-start justify-between gap-4">
        <h3 className={`font-medium text-base flex-1 min-w-0 ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
          {reminder.message}
        </h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={handleToggleChange}
          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        />
      </div>
      
      {/* Time and schedule info */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{formatTimeDisplay(reminder.time)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{formatDays(reminder.days)}</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button 
          size="sm"
          onClick={onEdit}
          variant="outline"
          className="text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
        >
          Edit
        </Button>
        <Button 
          size="sm"
          onClick={onRemove}
          className="text-xs bg-red-500 hover:bg-red-600 text-white border-none shadow-sm hover:shadow-md transition-all duration-200"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default App;
