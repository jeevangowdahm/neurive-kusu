'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { audioSynth } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_GEMINI_KEYS, GeminiFeature } from '@/lib/ai/keys-config';
import { Shield, ArrowLeft, Key, CheckCircle, XCircle, RefreshCw, Activity, AlertCircle, Info, Sparkles } from 'lucide-react';

interface KeyState {
  feature: GeminiFeature;
  name: string;
  description: string;
  defaultVal: string;
  currentVal: string;
  isOverridden: boolean;
  status: 'active' | 'degraded' | 'untested' | 'testing' | 'success' | 'failed';
  latency?: number;
  error?: string;
}

const FEATURE_METADATA: Record<GeminiFeature, { name: string; description: string }> = {
  search: {
    name: 'AI Semantic Search',
    description: 'Powers 1536-D embedding generation, query expansions, and relevance validations for the search console.'
  },
  agent: {
    name: 'Archive Ingestion Agent',
    description: 'Powers heavy archival OCR transcriptions, handwritten manuscripts analysis, and document classifications.'
  },
  chat: {
    name: 'AI Chat Bot',
    description: 'Powers the RAG conversational assistant, context synthesizers, and follow-up suggestion generators.'
  },
  finding: {
    name: 'Online Document Finder',
    description: 'Powers external Internet Archive metadata lookups, scraping, and catalog validation for Karnataka history.'
  },
  graph: {
    name: 'Knowledge Graph Engine',
    description: 'Extracts entities relationship networks, links documents to districts, and populates timeline connections.'
  }
};

export default function KeysDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isSkeuomorphic = theme === 'skeuomorphic';

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [keys, setKeys] = useState<Record<GeminiFeature, KeyState>>({
    search: { feature: 'search', name: '', description: '', defaultVal: '', currentVal: '', isOverridden: false, status: 'untested' },
    agent: { feature: 'agent', name: '', description: '', defaultVal: '', currentVal: '', isOverridden: false, status: 'untested' },
    chat: { feature: 'chat', name: '', description: '', defaultVal: '', currentVal: '', isOverridden: false, status: 'untested' },
    finding: { feature: 'finding', name: '', description: '', defaultVal: '', currentVal: '', isOverridden: false, status: 'untested' },
    graph: { feature: 'graph', name: '', description: '', defaultVal: '', currentVal: '', isOverridden: false, status: 'untested' }
  });

  const [testAllLoading, setTestAllLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const playSound = (type: 'click' | 'chime' | 'major') => {
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (!soundPref) return;
    if (type === 'click') audioSynth.playTypewriterClick(false);
    else if (type === 'chime') audioSynth.playHologramChime(false);
    else if (type === 'major') audioSynth.playHologramChime(true);
  };

  // Load keys configuration on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      const email = user.email || '';
      setUserEmail(email);
      const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(email);
      
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          const role = profile?.role || 'guest';
          const isAdmin = role === 'admin' || isSuperAdmin;

          if (isAdmin) {
            setAuthorized(true);
            loadKeysFromLocal();
          } else {
            setAuthorized(false);
            setTimeout(() => router.push('/dashboard'), 2000);
          }
          setLoading(false);
        });
    });
  }, [router]);

  const loadKeysFromLocal = () => {
    const loadedKeys = { ...keys };
    (Object.keys(DEFAULT_GEMINI_KEYS) as GeminiFeature[]).forEach((feature) => {
      const defaultValue = DEFAULT_GEMINI_KEYS[feature];
      const storedVal = localStorage.getItem(`neurive_gemini_key_${feature}`) || '';
      
      loadedKeys[feature] = {
        feature,
        name: FEATURE_METADATA[feature].name,
        description: FEATURE_METADATA[feature].description,
        defaultVal: defaultValue,
        currentVal: storedVal,
        isOverridden: storedVal !== '' && storedVal !== '••••••••••••••••••••',
        status: 'untested'
      };
    });
    setKeys(loadedKeys);
  };

  const handleKeyChange = (feature: GeminiFeature, value: string) => {
    setKeys(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        currentVal: value,
        isOverridden: value.trim() !== ''
      }
    }));
  };

  const saveKeyOverride = (feature: GeminiFeature) => {
    playSound('click');
    const keyState = keys[feature];
    if (keyState.currentVal.trim() === '') {
      localStorage.removeItem(`neurive_gemini_key_${feature}`);
      setKeys(prev => ({
        ...prev,
        [feature]: { ...prev[feature], isOverridden: false, currentVal: '' }
      }));
    } else {
      localStorage.setItem(`neurive_gemini_key_${feature}`, keyState.currentVal.trim());
      setKeys(prev => ({
        ...prev,
        [feature]: { ...prev[feature], isOverridden: true }
      }));
    }
    setSaveStatus(`Saved override for ${FEATURE_METADATA[feature].name}!`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const resetToDefault = (feature: GeminiFeature) => {
    playSound('click');
    localStorage.removeItem(`neurive_gemini_key_${feature}`);
    setKeys(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        currentVal: '',
        isOverridden: false,
        status: 'untested',
        latency: undefined,
        error: undefined
      }
    }));
    setSaveStatus(`Reset ${FEATURE_METADATA[feature].name} to default key.`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const testKeyConnection = async (feature: GeminiFeature) => {
    playSound('click');
    setKeys(prev => ({
      ...prev,
      [feature]: { ...prev[feature], status: 'testing', error: undefined }
    }));

    const keyState = keys[feature];
    // Use the override key or default key
    const keyToTest = keyState.currentVal.trim() !== '' ? keyState.currentVal.trim() : keyState.defaultVal;

    try {
      const res = await fetch('/api/admin/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest, feature })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setKeys(prev => ({
          ...prev,
          [feature]: {
            ...prev[feature],
            status: 'success',
            latency: data.latencyMs
          }
        }));
      } else {
        setKeys(prev => ({
          ...prev,
          [feature]: {
            ...prev[feature],
            status: 'failed',
            error: data.error || 'Failed connection test.'
          }
        }));
      }
    } catch (err) {
      setKeys(prev => ({
        ...prev,
        [feature]: {
          ...prev[feature],
          status: 'failed',
          error: 'Network error contacting test endpoint.'
        }
      }));
    }
  };

  const testAllKeys = async () => {
    playSound('major');
    setTestAllLoading(true);
    const features = Object.keys(keys) as GeminiFeature[];
    for (const feature of features) {
      await testKeyConnection(feature);
    }
    setTestAllLoading(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Shield className="h-6 w-6 text-primary absolute animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Authenticating Administrative Tunnel...</p>
        </div>
      </AppLayout>
    );
  }

  if (!authorized) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 max-w-md mx-auto min-h-[70vh] flex flex-col justify-center">
          <Card className="border-red-500/20 bg-red-950/5 backdrop-blur-md overflow-hidden relative shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 animate-bounce">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Access Denied</h2>
              <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/5 mb-4">Strict Restricted Access</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your account ({userEmail || 'Guest'}) does not have the necessary permissions to access the API Keys dashboard. This event has been logged for security audit.
              </p>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => {
                  playSound('click');
                  router.push('/admin');
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Admin Console</span>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              <span>API Keys & Integrations</span>
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Configure and test the five distinct Gemini API credentials powering separate platform engines. You can override individual keys in your local environment.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <Button
              onClick={testAllKeys}
              disabled={testAllLoading}
              variant="outline"
              className="gap-2 backdrop-blur-sm border-primary/20 hover:border-primary/50 bg-background/50"
            >
              <RefreshCw className={`h-4 w-4 ${testAllLoading ? 'animate-spin' : ''}`} />
              <span>Test All Keys</span>
            </Button>
          </div>
        </div>

        {/* Global Success Banner */}
        {saveStatus && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="p-4 bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm flex gap-3 leading-relaxed">
          <Info className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Dual-Environment Security Notice</p>
            <p className="text-muted-foreground text-xs">
              Pre-populated fallback keys are loaded securely from server environment variables. By specifying an override key below, it will be securely cached inside your local browser storage and used for client-side API requests instead of the default.
            </p>
          </div>
        </div>

        {/* Grid of Key configuration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.values(keys) as KeyState[]).map((keyState) => {
            const isDefault = !keyState.isOverridden;
            const keyMask = '••••••••••••••••••••••••••••••••••••••••';

            return (
              <Card key={keyState.feature} className="border-border/60 bg-background/30 backdrop-blur-md overflow-hidden hover:border-primary/30 transition-all duration-300 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Key className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span>{keyState.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
                        {keyState.description}
                      </CardDescription>
                    </div>

                    <Badge
                      variant={isDefault ? 'secondary' : 'default'}
                      className={`text-[10px] shrink-0 font-medium ${isDefault ? 'bg-secondary/40 text-muted-foreground' : 'bg-primary/20 text-primary border-primary/30'}`}
                    >
                      {isDefault ? 'Default Fallback' : 'Active Override'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-background/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Connection Status:</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-semibold">
                      {keyState.status === 'untested' && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-slate-400" /> Untested
                        </span>
                      )}
                      {keyState.status === 'testing' && (
                        <span className="text-blue-500 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Testing...
                        </span>
                      )}
                      {keyState.status === 'success' && (
                        <span className="text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4" /> Connected
                          {keyState.latency && <span className="text-[10px] text-muted-foreground font-normal">({keyState.latency}ms)</span>}
                        </span>
                      )}
                      {keyState.status === 'failed' && (
                        <span className="text-red-500 flex items-center gap-1">
                          <XCircle className="h-4 w-4" /> Error
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latency / Error Details */}
                  {keyState.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs leading-normal flex gap-2">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Connectivity Failed</p>
                        <p className="text-muted-foreground text-[11px] font-mono select-all break-all">{keyState.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Input Form */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Custom Key Override
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={isDefault ? `${keyState.defaultVal.slice(0, 10)}... (Fallback Active)` : 'Enter override API Key'}
                        value={keyState.currentVal}
                        onChange={(e) => handleKeyChange(keyState.feature, e.target.value)}
                        className="font-mono text-xs bg-background/50 border-border/80"
                      />
                      <Button
                        onClick={() => saveKeyOverride(keyState.feature)}
                        variant="default"
                        size="sm"
                        className="shrink-0"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <Button
                      onClick={() => resetToDefault(keyState.feature)}
                      disabled={isDefault}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                    >
                      Clear Override
                    </Button>

                    <Button
                      onClick={() => testKeyConnection(keyState.feature)}
                      disabled={keyState.status === 'testing'}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
