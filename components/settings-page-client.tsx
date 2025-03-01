'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  BellIcon, 
  PaletteIcon, 
  ShieldIcon, 
  UserIcon, 
  BellRingIcon, 
  BellOffIcon,
  MoonIcon,
  SunIcon,
  LaptopIcon,
  LanguagesIcon,
  ClockIcon,
  SaveIcon,
  TrashIcon
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTheme } from 'next-themes'

export function SettingsPageClient() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'system',
    fontSize: 'medium',
    reducedMotion: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    reminderNotifications: true,
    
    // Privacy
    shareTaskStats: false,
    allowDataCollection: true,
    
    // Preferences
    defaultView: 'list',
    language: 'en',
    timeFormat: '12h',
    startOfWeek: 'monday',
    
    // Account
    email: '',
    name: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  useEffect(() => {
    async function loadUserAndSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/signin')
          return
        }
        
        setUser(user)
        
        // Load user settings from database
        const { data: userSettings, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (userSettings) {
          setSettings(prev => ({
            ...prev,
            ...userSettings,
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
            theme: theme || 'system'
          }))
        } else {
          // Set defaults from user data
          setSettings(prev => ({
            ...prev,
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
            theme: theme || 'system'
          }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    
    loadUserAndSettings()
  }, [supabase, router, theme])
  
  const handleSettingChange = (section: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }
  
  const saveSettings = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      // Update theme if changed
      if (settings.theme !== theme) {
        setTheme(settings.theme)
      }
      
      // Save settings to database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          reminderNotifications: settings.reminderNotifications,
          shareTaskStats: settings.shareTaskStats,
          allowDataCollection: settings.allowDataCollection,
          defaultView: settings.defaultView,
          language: settings.language,
          timeFormat: settings.timeFormat,
          startOfWeek: settings.startOfWeek,
          fontSize: settings.fontSize,
          reducedMotion: settings.reducedMotion
        })
      
      if (error) throw error
      
      // Update user profile if name changed
      if (settings.name !== user.user_metadata?.full_name) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: settings.name }
        })
        
        if (updateError) throw updateError
      }
      
      // Update password if provided
      if (settings.newPassword && settings.newPassword === settings.confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: settings.newPassword
        })
        
        if (passwordError) throw passwordError
        
        // Clear password fields
        setSettings(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: ''
        }))
      }
      
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }
  
  const handleAccountDeletion = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      if (deleteConfirmation !== 'DELETE') {
        throw new Error('Please type DELETE to confirm')
      }
      
      // Call server function to delete account
      const { error } = await supabase.rpc('delete_user_account')
      
      if (error) throw error
      
      // Sign out
      await supabase.auth.signOut()
      router.push('/signin')
      toast.success('Account deleted successfully')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList className="grid grid-cols-5 mb-8">
        <TabsTrigger value="appearance" className="flex items-center gap-2">
          <PaletteIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Appearance</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <BellIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center gap-2">
          <ShieldIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Privacy</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Preferences</span>
        </TabsTrigger>
        <TabsTrigger value="account" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
        </TabsTrigger>
      </TabsList>
      
      {/* Appearance Settings */}
      <TabsContent value="appearance">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={settings.theme === 'light' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() => handleSettingChange('appearance', 'theme', 'light')}
                  >
                    <SunIcon className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button 
                    variant={settings.theme === 'dark' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() => handleSettingChange('appearance', 'theme', 'dark')}
                  >
                    <MoonIcon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button 
                    variant={settings.theme === 'system' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() => handleSettingChange('appearance', 'theme', 'system')}
                  >
                    <LaptopIcon className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select 
                  value={settings.fontSize} 
                  onValueChange={(value) => handleSettingChange('appearance', 'fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations throughout the application
                  </p>
                </div>
                <Switch 
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => handleSettingChange('appearance', 'reducedMotion', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving} className="ml-auto">
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
      
      {/* Notifications Settings */}
      <TabsContent value="notifications">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about tasks and updates via email
                  </p>
                </div>
                <Switch 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser
                  </p>
                </div>
                <Switch 
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about upcoming and due tasks
                  </p>
                </div>
                <Switch 
                  checked={settings.reminderNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'reminderNotifications', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving} className="ml-auto">
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
      
      {/* Privacy Settings */}
      <TabsContent value="privacy">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your data and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share Task Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sharing of anonymized task completion statistics
                  </p>
                </div>
                <Switch 
                  checked={settings.shareTaskStats}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'shareTaskStats', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Usage Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow collection of usage data to improve the application
                  </p>
                </div>
                <Switch 
                  checked={settings.allowDataCollection}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'allowDataCollection', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving} className="ml-auto">
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
      
      {/* Preferences Settings */}
      <TabsContent value="preferences">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize how the application works for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default View</Label>
                <Select 
                  value={settings.defaultView} 
                  onValueChange={(value) => handleSettingChange('preferences', 'defaultView', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="board">Board View</SelectItem>
                    <SelectItem value="calendar">Calendar View</SelectItem>
                    <SelectItem value="gantt">Gantt View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Language</Label>
                <Select 
                  value={settings.language} 
                  onValueChange={(value) => handleSettingChange('preferences', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select 
                  value={settings.timeFormat} 
                  onValueChange={(value) => handleSettingChange('preferences', 'timeFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (13:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Start of Week</Label>
                <Select 
                  value={settings.startOfWeek} 
                  onValueChange={(value) => handleSettingChange('preferences', 'startOfWeek', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start of week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={saving} className="ml-auto">
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
      
      {/* Account Settings */}
      <TabsContent value="account">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  value={settings.email} 
                  disabled 
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={settings.name} 
                  onChange={(e) => handleSettingChange('account', 'name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Change Password</h3>
                
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    value={settings.newPassword} 
                    onChange={(e) => handleSettingChange('account', 'newPassword', e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={settings.confirmPassword} 
                    onChange={(e) => handleSettingChange('account', 'confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Label>
                      Type DELETE to confirm
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE to confirm"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleAccountDeletion}
                      disabled={saving || deleteConfirmation !== 'DELETE'}
                    >
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
} 