'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, RefreshCw, Activity, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Loader2, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';
import Link from 'next/link';

// Access guard
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard';
import { ReviewerGuide } from '@/components/admin/ReviewerGuide';

export default function AdminHealthCheckPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<any[]>([]);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      const data = await res.json();
      if (data.success) {
        setChecks(data.checks || []);
      } else {
        toast.error(data.error || 'Failed to execute health check');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with environment health checker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const totalChecks = checks.length;
  const failedChecks = checks.filter(c => c.status === 'failed').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const healthyChecks = checks.filter(c => c.status === 'healthy').length;

  return (
    <AppLayout>
      <AdminAccessGuard>
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
          
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div className="space-y-1">
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mb-1">
                <ArrowLeft className="h-4 w-4" />
                Return to Admin Console
              </Link>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                <h1 className="text-xl font-bold text-foreground font-serif">Environment Health & Diagnostics</h1>
                <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">System Integrity</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Verify cloud connections, required database indexes, RPC triggers, storage buckets, and LLM integrations.
              </p>
            </div>
            
            <Button 
              onClick={loadHealthData} 
              variant="outline" 
              size="sm" 
              className="h-9 text-xs font-semibold border-slate-800 text-slate-300 gap-1.5 self-end sm:self-center"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-run Diagnostic
            </Button>
          </div>

          {/* Diagnostic status cockpit grid */}
          <div className="grid grid-cols-3 gap-4 select-none">
            <Card className="border border-emerald-950 bg-emerald-950/5">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                <span className="text-[9px] text-slate-500 uppercase font-mono block">Healthy Checks</span>
                <span className="text-2xl font-bold text-emerald-400 font-serif mt-1">{healthyChecks}</span>
              </CardContent>
            </Card>

            <Card className="border border-amber-950 bg-amber-950/5">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500 mb-1" />
                <span className="text-[9px] text-slate-500 uppercase font-mono block">Warnings</span>
                <span className="text-2xl font-bold text-amber-400 font-serif mt-1">{warningChecks}</span>
              </CardContent>
            </Card>

            <Card className="border border-rose-950 bg-rose-950/5">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <XCircle className="h-6 w-6 text-rose-500 mb-1" />
                <span className="text-[9px] text-slate-500 uppercase font-mono block">Failing Checks</span>
                <span className="text-2xl font-bold text-rose-400 font-serif mt-1">{failedChecks}</span>
              </CardContent>
            </Card>
          </div>

          {/* Loader or Content */}
          {loading ? (
            <Card className="border bg-slate-900/10 border-slate-900 py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-mono text-slate-400">Probing environment controllers...</span>
            </Card>
          ) : (
            <div className="space-y-4">
              
              {failedChecks > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-lg flex gap-3 select-none">
                  <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold font-mono uppercase text-rose-400 block">System Degraded</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Failing checks detected. Some platform functionalities (such as ingestion, RAG chat, or hybrid search) may not be operating correctly. Please apply the fix suggestions below to restore system integrity.
                    </p>
                  </div>
                </div>
              )}

              {failedChecks === 0 && warningChecks === 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-lg flex gap-3 select-none">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold font-mono uppercase text-emerald-400 block">Production Ready</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      All system integrity checks passed successfully. Neurive is ready for deployment, demonstration, and reviewer evaluation.
                    </p>
                  </div>
                </div>
              )}

              {/* Checks list */}
              <div className="space-y-3">
                {checks.map((chk) => {
                  const StatusIcon = chk.status === 'healthy' ? CheckCircle2 :
                                     chk.status === 'warning' ? AlertTriangle : XCircle;
                  
                  const statusColor = chk.status === 'healthy' ? 'text-emerald-500' :
                                      chk.status === 'warning' ? 'text-amber-500' : 'text-rose-500';

                  const cardBorderColor = chk.status === 'healthy' ? 'border-slate-900/60' :
                                          chk.status === 'warning' ? 'border-amber-500/15' : 'border-rose-500/25';

                  return (
                    <Card key={chk.id} className={`border bg-slate-900/20 shadow-sm transition-all duration-300 ${cardBorderColor}`}>
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${statusColor}`} />
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-200 font-sans block leading-none">
                              {chk.name}
                            </span>
                            <p className="text-xs text-slate-400 leading-normal">
                              {chk.message}
                            </p>
                            {chk.fix && (
                              <div className="bg-slate-950 border border-slate-900/80 p-2.5 rounded-lg mt-2 select-text">
                                <span className="text-[9px] font-bold font-mono uppercase block text-primary">Repair Manual</span>
                                <p className="text-[11px] text-slate-300 font-mono leading-relaxed mt-0.5">
                                  {chk.fix}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Badge className={`text-[9px] font-mono font-bold uppercase py-0.5 px-2.5 h-fit select-none shrink-0 self-end md:self-center ${
                          chk.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          chk.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-bounce'
                        }`}>
                          {chk.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

            </div>
          )}

          <ReviewerGuide />
        </div>
      </AdminAccessGuard>
    </AppLayout>
  );
}
