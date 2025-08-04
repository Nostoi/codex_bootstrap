import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useNotificationPreferences,
  NotificationPreferences as NotificationPreferencesType,
} from '@/hooks/useNotificationPreferences';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Clock,
  Settings,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Info,
  RefreshCw,
  RotateCcw,
  Loader2,
  Moon,
  Sun,
  Brain,
  Heart,
  Zap,
  Eye,
  Play,
  Pause,
  Music,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPreferencesProps {
  className?: string;
  onPreferencesChange?: (preferences: NotificationPreferencesType) => void;
}

// Template preview data types
interface TemplatePreviewData {
  type: string;
  label: string;
  content: string;
  format: 'full' | 'subject' | 'fallback';
}

// Sound options
const notificationSounds = [
  {
    id: 'gentle-chime',
    name: 'Gentle Chime',
    file: '/sounds/gentle-chime.mp3',
    description: 'Soft, calming notification',
  },
  {
    id: 'soft-bell',
    name: 'Soft Bell',
    file: '/sounds/soft-bell.mp3',
    description: 'Traditional but gentle',
  },
  {
    id: 'water-drop',
    name: 'Water Drop',
    file: '/sounds/water-drop.mp3',
    description: 'Natural, subtle sound',
  },
  {
    id: 'wind-chime',
    name: 'Wind Chime',
    file: '/sounds/wind-chime.mp3',
    description: 'Peaceful, ambient',
  },
  {
    id: 'digital-beep',
    name: 'Digital Beep',
    file: '/sounds/digital-beep.mp3',
    description: 'Clear, modern alert',
  },
  { id: 'none', name: 'Silent', file: '', description: 'No sound' },
];

const notificationTypeConfig = {
  'task-update': {
    label: 'Task Updates',
    description: 'Notifications when tasks are created, updated, or completed',
    icon: CheckCircle,
    color: 'text-blue-500',
  },
  'calendar-sync': {
    label: 'Calendar Sync',
    description: 'Notifications about calendar synchronization and events',
    icon: Calendar,
    color: 'text-green-500',
  },
  'deadline-reminder': {
    label: 'Deadline Reminders',
    description: 'Alerts for upcoming task deadlines and due dates',
    icon: AlertTriangle,
    color: 'text-orange-500',
  },
  'conflict-alert': {
    label: 'Conflict Alerts',
    description: 'Warnings about scheduling conflicts and calendar issues',
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  'plan-regeneration': {
    label: 'Plan Updates',
    description: 'Notifications when daily plans are updated or regenerated',
    icon: RefreshCw,
    color: 'text-purple-500',
  },
};

const urgencyLevels = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  className,
  onPreferencesChange,
}) => {
  const {
    preferences,
    summary,
    loading,
    error,
    saving,
    isInQuietHours,
    updatePreferences,
    resetToDefaults,
    updateTypePreference,
    updateQuietHours,
    updateAdhdSettings,
    toggleGlobalNotifications,
    toggleNotificationType,
    isValidTimeFormat,
    hasPreferences,
  } = useNotificationPreferences();

  const [previewMode, setPreviewMode] = useState(false);
  const [templatePreviews, setTemplatePreviews] = useState<TemplatePreviewData[]>([]);
  const [selectedSound, setSelectedSound] = useState('gentle-chime');
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [loadingPreviews, setLoadingPreviews] = useState(false);

  // Initialize selected sound from localStorage on client side
  useEffect(() => {
    const savedSound = localStorage.getItem('notificationSound');
    if (savedSound) {
      setSelectedSound(savedSound);
    }
  }, []);

  // Load template previews when preview mode is enabled
  useEffect(() => {
    if (previewMode && templatePreviews.length === 0) {
      loadTemplatePreviews();
    }
  }, [previewMode]);

  const loadTemplatePreviews = async () => {
    setLoadingPreviews(true);
    try {
      // Mock user data for preview - in real app, this would come from backend
      const mockUserData = {
        name: 'John Doe',
        currentEnergyLevel: 'HIGH',
        tasks: [{ title: 'Complete project documentation', status: 'IN_PROGRESS', priority: 4 }],
      };

      // Generate previews for each notification type
      const previews: TemplatePreviewData[] = await Promise.all(
        Object.entries(notificationTypeConfig).map(async ([type, config]) => {
          const content = await generateTemplatePreview(type, mockUserData);
          return {
            type,
            label: config.label,
            content,
            format: 'full' as const,
          };
        })
      );

      setTemplatePreviews(previews);
    } catch (error) {
      console.error('Failed to load template previews:', error);
    } finally {
      setLoadingPreviews(false);
    }
  };

  const generateTemplatePreview = async (type: string, userData: any): Promise<string> => {
    // Mock template generation - in real app, this would call backend API
    const templates = {
      'task-update': `Good afternoon ${userData.name}! 🌟
Your 📌 task "${userData.tasks[0]?.title || 'Sample Task'}" was updated.
⏰ Due: Tomorrow at 3:00 PM
⚡ Energy: 🚀 High Energy
🎯 Focus: 🎨 Creative Work
✨ You're crushing it today! 🚀`,

      'calendar-sync': `📅 Calendar Update ${userData.name}!
Your schedule has been synchronized with 3 new events.
🔄 Next: Team Meeting in 30 minutes
💡 Energy tip: You're in a high-energy zone right now!`,

      'deadline-reminder': `⏰ Gentle Reminder ${userData.name}!
Your 📌 task "${userData.tasks[0]?.title || 'Sample Task'}" is due tomorrow.
⚡ Energy required: 🚀 High Energy (perfect for you right now!)
💪 You've got this! One step at a time.`,

      'conflict-alert': `⚠️ Schedule Conflict Alert ${userData.name}!
Two meetings overlap tomorrow at 2:00 PM.
🔧 Suggested action: Reschedule the shorter meeting
🧠 ADHD tip: Color-code your calendar to avoid future conflicts!`,

      'plan-regeneration': `🔄 Daily Plan Updated ${userData.name}!
Your plan has been optimized based on your energy patterns.
✨ 3 tasks moved to high-energy morning slots
💡 Break suggestions added for sustained focus`,
    };

    return templates[type as keyof typeof templates] || `${type} notification preview`;
  };

  const playNotificationSound = (soundId: string) => {
    if (soundId === 'none') return;

    const sound = notificationSounds.find(s => s.id === soundId);
    if (!sound || !sound.file) return;

    const audio = new Audio(sound.file);
    setAudioPlaying(soundId);

    audio
      .play()
      .then(() => {
        audio.addEventListener('ended', () => setAudioPlaying(null));
      })
      .catch(error => {
        console.error('Failed to play sound:', error);
        setAudioPlaying(null);
      });
  };

  const handleSoundChange = async (soundId: string) => {
    setSelectedSound(soundId);
    // Note: soundTheme would need to be added to NotificationPreferences type
    // For now, we'll store it in localStorage or handle it separately
    localStorage.setItem('notificationSound', soundId);
    if (preferences) {
      onPreferencesChange?.(preferences);
    }
  };

  if (loading && !hasPreferences) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading notification preferences...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Error loading preferences</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  const handleGlobalToggle = async (enabled: boolean) => {
    await toggleGlobalNotifications(enabled);
    onPreferencesChange?.(preferences);
  };

  const handleTypeToggle = async (
    type: keyof NotificationPreferencesType['types'],
    enabled: boolean
  ) => {
    await toggleNotificationType(type, enabled);
    onPreferencesChange?.(preferences);
  };

  const handleUrgencyChange = async (
    type: keyof NotificationPreferencesType['types'],
    urgency: string
  ) => {
    await updateTypePreference(type, { urgencyThreshold: urgency as any });
    onPreferencesChange?.(preferences);
  };

  const handleQuietHoursToggle = async (enabled: boolean) => {
    await updateQuietHours({ enabled });
    onPreferencesChange?.(preferences);
  };

  const handleQuietHoursTimeChange = async (field: 'start' | 'end', time: string) => {
    if (isValidTimeFormat(time)) {
      await updateQuietHours({ [field]: time });
      onPreferencesChange?.(preferences);
    }
  };

  const handleBatchingToggle = async (enabled: boolean) => {
    await updatePreferences({ batchingEnabled: enabled });
    onPreferencesChange?.(preferences);
  };

  const handleBatchIntervalChange = async (interval: number) => {
    await updatePreferences({ batchInterval: interval * 1000 }); // Convert to milliseconds
    onPreferencesChange?.(preferences);
  };

  const handleMaxBatchChange = async (max: number) => {
    await updatePreferences({ maxNotificationsPerBatch: max });
    onPreferencesChange?.(preferences);
  };

  const handleAudioToggle = async (enabled: boolean) => {
    await updatePreferences({ audioEnabled: enabled });
    onPreferencesChange?.(preferences);
  };

  const handleAdhdSettingToggle = async (
    setting: keyof NotificationPreferencesType['adhd'],
    enabled: boolean
  ) => {
    await updateAdhdSettings({ [setting]: enabled });
    onPreferencesChange?.(preferences);
  };

  const handleReset = async () => {
    if (
      window.confirm('Are you sure you want to reset all notification preferences to defaults?')
    ) {
      await resetToDefaults();
      onPreferencesChange?.(preferences);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                {preferences.globalEnabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                Notification Preferences
              </CardTitle>
              {isInQuietHours && (
                <Badge variant="default" className="text-xs">
                  <Moon className="w-3 h-3 mr-1" />
                  Quiet Hours Active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                {previewMode ? 'Hide Templates' : 'Preview Templates & Sounds'}
              </Button>

              <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {summary && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {summary.totalEnabled} of {summary.totalTypes} types enabled
              </span>
              {summary.quietHoursEnabled && <span>• Quiet hours enabled</span>}
              {summary.batchingEnabled && <span>• Batching enabled</span>}
              {summary.adhdOptimized && (
                <Badge variant="default" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  ADHD Optimized
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Global Enable/Disable */}
          <div className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">Master Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable all notifications globally
              </p>
            </div>
            <Switch
              checked={preferences.globalEnabled}
              onCheckedChange={handleGlobalToggle}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(notificationTypeConfig).map(([type, config]) => {
            const typePreference =
              preferences.types[type as keyof NotificationPreferencesType['types']];
            const IconComponent = config.icon;

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={cn('w-5 h-5', config.color)} />
                    <div>
                      <Label className="text-base font-medium">{config.label}</Label>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={typePreference.enabled}
                    onCheckedChange={enabled => handleTypeToggle(type as any, enabled)}
                    disabled={saving || !preferences.globalEnabled}
                  />
                </div>

                {typePreference.enabled && (
                  <div className="ml-8 space-y-2">
                    <Label className="text-sm">Urgency Threshold</Label>
                    <Select
                      value={typePreference.urgencyThreshold}
                      onValueChange={value => handleUrgencyChange(type as any, value)}
                      disabled={saving}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(urgencyLevels).map(([level, config]) => (
                          <SelectItem key={level} value={level}>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className={cn('text-xs', config.color)}>
                                {config.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Only show notifications at or above this urgency level
                    </p>
                  </div>
                )}

                {type !==
                  Object.keys(notificationTypeConfig)[
                    Object.keys(notificationTypeConfig).length - 1
                  ] && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Suppress non-critical notifications during specified hours
              </p>
            </div>
            <Switch
              checked={preferences.quietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
              disabled={saving}
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Start Time</Label>
                <Input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={e => handleQuietHoursTimeChange('start', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">End Time</Label>
                <Input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={e => handleQuietHoursTimeChange('end', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Delivery Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.audioEnabled ? (
                <Volume2 className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base font-medium">Audio Notifications</Label>
                <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.audioEnabled}
              onCheckedChange={handleAudioToggle}
              disabled={saving}
            />
          </div>

          <Separator />

          {/* Batching */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Smart Batching</Label>
                <p className="text-sm text-muted-foreground">
                  Group related notifications to reduce interruptions
                </p>
              </div>
              <Switch
                checked={preferences.batchingEnabled}
                onCheckedChange={handleBatchingToggle}
                disabled={saving}
              />
            </div>

            {preferences.batchingEnabled && (
              <div className="ml-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Batch Interval: {preferences.batchInterval / 1000}s
                  </Label>
                  <Slider
                    value={[preferences.batchInterval / 1000]}
                    onValueChange={([value]) => handleBatchIntervalChange(value)}
                    min={5}
                    max={300}
                    step={5}
                    className="w-full"
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wait time before sending grouped notifications
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Max per Batch: {preferences.maxNotificationsPerBatch}
                  </Label>
                  <Slider
                    value={[preferences.maxNotificationsPerBatch]}
                    onValueChange={([value]) => handleMaxBatchChange(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum notifications to group together
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ADHD-Friendly Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ADHD-Friendly Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Focus Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce notification frequency during focused work
              </p>
            </div>
            <Switch
              checked={preferences.adhd.focusModeEnabled}
              onCheckedChange={enabled => handleAdhdSettingToggle('focusModeEnabled', enabled)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Gentle Alerts Only</Label>
              <p className="text-sm text-muted-foreground">
                Use subtle, non-disruptive notification styles
              </p>
            </div>
            <Switch
              checked={preferences.adhd.gentleAlertsOnly}
              onCheckedChange={enabled => handleAdhdSettingToggle('gentleAlertsOnly', enabled)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <div>
                <Label className="text-base font-medium">Progress Celebration</Label>
                <p className="text-sm text-muted-foreground">
                  Get encouraging notifications for task completions
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.adhd.progressCelebration}
              onCheckedChange={enabled => handleAdhdSettingToggle('progressCelebration', enabled)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Previews and Sound Selection */}
      {previewMode && (
        <div className="space-y-6">
          {/* Template Previews */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Template Previews
                <Badge variant="default" className="ml-2">
                  With Your Data
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPreviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Generating personalized previews...
                </div>
              ) : (
                <Tabs defaultValue="task-update" className="w-full">
                  <TabsList className="grid grid-cols-5 w-full">
                    {templatePreviews.map(preview => (
                      <TabsTrigger key={preview.type} value={preview.type} className="text-xs">
                        {preview.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {templatePreviews.map(preview => (
                    <TabsContent key={preview.type} value={preview.type} className="mt-4">
                      <div className="space-y-4">
                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Live Preview</span>
                          </div>
                          <div
                            className="text-sm leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: preview.content.replace(/\n/g, '<br>'),
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded border">
                            <Label className="text-xs font-medium text-gray-600">
                              Subject Line
                            </Label>
                            <p className="text-sm mt-1">✨ {preview.label}: Sample Task Update</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded border">
                            <Label className="text-xs font-medium text-gray-600">
                              Fallback (Plain Text)
                            </Label>
                            <p className="text-sm mt-1">
                              {preview.content.replace(/[🌟📌⏰⚡🎯✨🚀📅🔄💡⭐💪🧠🔧⚠️]/g, '')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Sound Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Notification Sounds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notificationSounds.map(sound => (
                  <div
                    key={sound.id}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-colors',
                      selectedSound === sound.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => handleSoundChange(sound.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">{sound.name}</Label>
                        <p className="text-sm text-muted-foreground">{sound.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sound.file && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              playNotificationSound(sound.id);
                            }}
                            disabled={audioPlaying === sound.id}
                          >
                            {audioPlaying === sound.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {selectedSound === sound.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Custom Sound Upload</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload your own notification sound (MP3, WAV, OGG)
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Sound
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Settings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Status:</strong> {preferences.globalEnabled ? 'Enabled' : 'Disabled'}
                </p>
                <p>
                  <strong>Active Types:</strong>{' '}
                  {Object.values(preferences.types).filter(t => t.enabled).length} of{' '}
                  {Object.keys(preferences.types).length}
                </p>
                <p>
                  <strong>Quiet Hours:</strong>{' '}
                  {preferences.quietHours.enabled
                    ? `${preferences.quietHours.start} - ${preferences.quietHours.end}`
                    : 'Disabled'}
                </p>
                <p>
                  <strong>Audio:</strong> {preferences.audioEnabled ? 'Enabled' : 'Disabled'}
                </p>
                <p>
                  <strong>Sound Theme:</strong>{' '}
                  {notificationSounds.find(s => s.id === selectedSound)?.name || 'Default'}
                </p>
                <p>
                  <strong>Batching:</strong>{' '}
                  {preferences.batchingEnabled
                    ? `${preferences.batchInterval / 1000}s intervals, max ${preferences.maxNotificationsPerBatch}`
                    : 'Disabled'}
                </p>
                <p>
                  <strong>ADHD Features:</strong>{' '}
                  {Object.values(preferences.adhd).filter(Boolean).length} enabled
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving preferences...
          </div>
        </div>
      )}
    </div>
  );
};
