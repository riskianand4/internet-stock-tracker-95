import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Eye, EyeOff, Plus, Key, Shield, Activity, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/contexts/ApiContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  rateLimit: number;
}
const PERMISSIONS = {
  'read': 'Read Access',
  'write': 'Write Access',
  'admin': 'Admin Access',
  'analytics': 'Analytics Access'
};
export const ApiKeyManagement: React.FC = () => {
  const { apiService, isConfigured, isOnline } = useApi();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [] as string[],
    expiresAt: '',
    rateLimit: 1000
  });

  // Load API keys from backend or localStorage fallback
  const loadApiKeys = async () => {
    setLoading(true);
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await apiService.request('/admin/api-keys', {
          method: 'GET'
        });
        
        if (response.success) {
          setApiKeys(response.data.map((key: any) => ({
            ...key,
            createdAt: new Date(key.createdAt),
            lastUsed: key.lastUsed ? new Date(key.lastUsed) : null,
            expiresAt: key.expiresAt ? new Date(key.expiresAt) : null
          })));
        } else {
          throw new Error(response.error || 'Failed to load API keys');
        }
      } else {
        // Fallback to localStorage for development
        const saved = localStorage.getItem('api-keys');
        if (saved) {
          const parsed = JSON.parse(saved);
          setApiKeys(parsed.map((key: any) => ({
            ...key,
            createdAt: new Date(key.createdAt),
            lastUsed: key.lastUsed ? new Date(key.lastUsed) : null,
            expiresAt: key.expiresAt ? new Date(key.expiresAt) : null
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys');
      
      // Fallback to localStorage on error
      const saved = localStorage.getItem('api-keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        setApiKeys(parsed.map((key: any) => ({
          ...key,
          createdAt: new Date(key.createdAt),
          lastUsed: key.lastUsed ? new Date(key.lastUsed) : null,
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : null
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [isConfigured, isOnline]);
  const saveApiKeys = (keys: ApiKey[]) => {
    // Save to localStorage as fallback
    localStorage.setItem('api-keys', JSON.stringify(keys));
    setApiKeys(keys);
  };
  
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const prefix = 'sk_live_';
    let result = prefix;
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const handleCreateApiKey = async () => {
    if (!newKey.name.trim()) {
      toast.error('API key name is required');
      return;
    }
    if (newKey.permissions.length === 0) {
      toast.error('At least one permission is required');
      return;
    }

    try {
      if (isConfigured && isOnline && apiService) {
        const response = await apiService.request('/admin/api-keys', {
          method: 'POST',
          body: JSON.stringify(newKey)
        });
        
        if (response.success) {
          await loadApiKeys(); // Reload from backend
          toast.success('API key created successfully');
          
          // Show the actual key to user (only time it's shown)
          if (response.data.key) {
            toast.success(`New API Key: ${response.data.key}`, {
              duration: 10000,
              description: 'Please save this key securely. It will not be shown again.'
            });
          }
        } else {
          throw new Error(response.error || 'Failed to create API key');
        }
      } else {
        // Fallback to localStorage for development
        const apiKey: ApiKey = {
          id: crypto.randomUUID(),
          name: newKey.name,
          key: generateApiKey(),
          permissions: newKey.permissions,
          isActive: true,
          usageCount: 0,
          lastUsed: null,
          createdAt: new Date(),
          expiresAt: newKey.expiresAt ? new Date(newKey.expiresAt) : null,
          rateLimit: newKey.rateLimit
        };
        const updatedKeys = [...apiKeys, apiKey];
        saveApiKeys(updatedKeys);
        toast.success('API key created successfully (local storage)');
      }
      
      setIsCreateDialogOpen(false);
      setNewKey({
        name: '',
        permissions: [],
        expiresAt: '',
        rateLimit: 1000
      });
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    }
  };
  const handleDeleteApiKey = async (id: string) => {
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await apiService.request(`/admin/api-keys/${id}`, {
          method: 'DELETE'
        });
        
        if (response.success) {
          await loadApiKeys(); // Reload from backend
          toast.success('API key deleted');
        } else {
          throw new Error(response.error || 'Failed to delete API key');
        }
      } else {
        // Fallback to localStorage
        const updatedKeys = apiKeys.filter(key => key.id !== id);
        saveApiKeys(updatedKeys);
        toast.success('API key deleted (local storage)');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    }
  };
  
  const toggleApiKeyStatus = async (id: string) => {
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await apiService.request(`/admin/api-keys/${id}/toggle`, {
          method: 'PATCH'
        });
        
        if (response.success) {
          await loadApiKeys(); // Reload from backend
          toast.success('API key status updated');
        } else {
          throw new Error(response.error || 'Failed to update API key status');
        }
      } else {
        // Fallback to localStorage
        const updatedKeys = apiKeys.map(key => key.id === id ? {
          ...key,
          isActive: !key.isActive
        } : key);
        saveApiKeys(updatedKeys);
        toast.success('API key status updated (local storage)');
      }
    } catch (error) {
      console.error('Failed to update API key status:', error);
      toast.error('Failed to update API key status');
    }
  };
  const toggleKeyVisibility = (id: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(id)) {
      newVisibleKeys.delete(id);
    } else {
      newVisibleKeys.add(id);
    }
    setVisibleKeys(newVisibleKeys);
  };
  const formatKey = (key: string, visible: boolean) => {
    if (visible) return key;
    return `${key.substring(0, 12)}${'•'.repeat(36)}`;
  };
  const getPermissionBadgeVariant = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'destructive';
      case 'write':
        return 'default';
      case 'analytics':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  return <div className="space-y-6">
      {!isConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            External API is not configured. API key management is running in local mode for development.
            Configure your backend API in Settings to enable full functionality.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          
          
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key with specific permissions and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newKey.name} onChange={e => setNewKey({
                ...newKey,
                name: e.target.value
              })} placeholder="Production API, Development Key, etc." />
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(PERMISSIONS).map(([key, label]) => <div key={key} className="flex items-center space-x-2">
                      <Switch checked={newKey.permissions.includes(key)} onCheckedChange={checked => {
                    if (checked) {
                      setNewKey({
                        ...newKey,
                        permissions: [...newKey.permissions, key]
                      });
                    } else {
                      setNewKey({
                        ...newKey,
                        permissions: newKey.permissions.filter(p => p !== key)
                      });
                    }
                  }} />
                      <Label className="text-sm">{label}</Label>
                    </div>)}
                </div>
              </div>

              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                <Input id="rateLimit" type="number" value={newKey.rateLimit} onChange={e => setNewKey({
                ...newKey,
                rateLimit: parseInt(e.target.value) || 1000
              })} />
              </div>

              <div>
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input id="expiresAt" type="datetime-local" value={newKey.expiresAt} onChange={e => setNewKey({
                ...newKey,
                expiresAt: e.target.value
              })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateApiKey}>Create API Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Active API Keys ({apiKeys.length})
          </CardTitle>
          <CardDescription>
            Manage and monitor your API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading API keys...</p>
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map(apiKey => <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatKey(apiKey.key, visibleKeys.has(apiKey.id))}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {apiKey.permissions.map(permission => <Badge key={permission} variant={getPermissionBadgeVariant(permission)} className="text-xs">
                          {PERMISSIONS[permission as keyof typeof PERMISSIONS]}
                        </Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      {apiKey.usageCount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsed ? <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {apiKey.lastUsed.toLocaleDateString()}
                      </div> : <span className="text-muted-foreground">Never</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={apiKey.isActive} onCheckedChange={() => toggleApiKeyStatus(apiKey.id)} />
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteApiKey(apiKey.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
            </Table>
          )}
          
          {!loading && apiKeys.length === 0 && <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API keys created yet</p>
              <p className="text-sm">Create your first API key to get started</p>
            </div>}
        </CardContent>
      </Card>
    </div>;
};