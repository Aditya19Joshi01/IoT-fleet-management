import { useState } from 'react';
import { User, Bell, MapPin, Settings as SettingsIcon, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { useFleetStore } from '@/store/fleetStore';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Settings() {
  const { user } = useAuthStore();
  const { geofences, fetchGeofences, deleteGeofence } = useFleetStore();

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass-card p-1 w-full justify-start">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="geofences" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Geofences
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileSettings user={user} />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Geofences Tab */}
        <TabsContent value="geofences">
          <GeofenceSettings geofences={geofences} onDelete={deleteGeofence} />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface UserProfile {
  username?: string;
  email?: string;
}

function ProfileSettings({ user }: { user: UserProfile }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="font-semibold text-lg text-foreground">User Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-field w-full"
          />
        </div>
      </div>

      <div className="border-t border-glass-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    lowFuel: true,
    speeding: true,
    geofence: true,
    maintenance: true,
    hardBrake: false,
  });

  const handleSave = () => {
    toast.success('Notification preferences saved');
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="font-semibold text-lg text-foreground">Notification Preferences</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-glass-border">
          <div>
            <p className="font-medium text-foreground">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Receive alerts via email</p>
          </div>
          <Switch
            checked={settings.emailAlerts}
            onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-glass-border">
          <div>
            <p className="font-medium text-foreground">SMS Notifications</p>
            <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
          </div>
          <Switch
            checked={settings.smsAlerts}
            onCheckedChange={(checked) => setSettings({ ...settings, smsAlerts: checked })}
          />
        </div>
      </div>

      <div>
        <h3 className="font-medium text-foreground mb-4">Alert Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'lowFuel', label: 'Low Fuel Warnings' },
            { key: 'speeding', label: 'Speeding Alerts' },
            { key: 'geofence', label: 'Geofence Breaches' },
            { key: 'maintenance', label: 'Maintenance Reminders' },
            { key: 'hardBrake', label: 'Hard Braking Events' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-glass/50">
              <span className="text-sm">{item.label}</span>
              <Switch
                checked={settings[item.key as keyof typeof settings]}
                onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

interface GeofenceDisplay {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  color: string;
}

function GeofenceSettings({ geofences, onDelete }: { geofences: GeofenceDisplay[]; onDelete: (id: string) => void }) {
  const handleDelete = (id: string, name: string) => {
    onDelete(id);
    toast.success(`Geofence "${name}" deleted`);
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-glass-border">
        <h2 className="font-semibold text-lg text-foreground">Manage Geofences</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="bg-glass">
              <th>Name</th>
              <th>Center</th>
              <th>Radius</th>
              <th>Color</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {geofences.map((geo) => (
              <tr key={geo.id}>
                <td className="font-medium">{geo.name}</td>
                <td className="font-mono text-sm text-muted-foreground">
                  {geo.center_lat.toFixed(4)}, {geo.center_lng.toFixed(4)}
                </td>
                <td>{geo.radius_meters}m</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: geo.color }}
                    />
                    <span className="text-sm text-muted-foreground">{geo.color}</span>
                  </div>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(geo.id, geo.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {geofences.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No geofences created yet</p>
          <p className="text-sm">Create geofences from the Live Map page</p>
        </div>
      )}
    </div>
  );
}

function SystemSettings() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api');
  const [wsUrl, setWsUrl] = useState('ws://localhost:8000/api/ws/');

  const handleSave = () => {
    toast.success('System settings saved');
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="font-semibold text-lg text-foreground">System Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">API Endpoint</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="input-field w-full font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Base URL for REST API calls</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">WebSocket URL</label>
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            className="input-field w-full font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">URL for real-time data streaming</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
        <p className="text-sm text-warning font-medium">Demo Mode Active</p>
        <p className="text-xs text-muted-foreground mt-1">
          The application is running in demo mode with mock data. Connect to your backend API for production use.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
