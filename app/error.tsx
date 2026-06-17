'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertOctagon, RotateCcw, Home, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error securely for telemetry analytics
    console.error('Neurive Global Error Boundary caught exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="max-w-md w-full border-red-500/20 bg-slate-900/40 backdrop-blur-md overflow-hidden relative shadow-2xl z-10">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
        <CardContent className="p-8 text-center flex flex-col items-center select-none">
          <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <AlertOctagon className="h-8 w-8 text-red-500 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight font-serif mb-2">
            System Interrupted
          </h2>
          
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            An unexpected error occurred during execution. The telemetry system has cataloged this event for auditor analysis.
          </p>

          <div className="w-full bg-slate-950/80 border border-slate-900 rounded-lg p-3.5 mb-6 text-left overflow-x-auto max-h-[120px]">
            <span className="text-[9px] font-bold font-mono uppercase text-red-400 block mb-1">Diagnostic Log</span>
            <p className="text-[10px] text-slate-300 font-mono leading-normal select-text">
              {error.message || 'ReferenceError: Unknown runtime process failure.'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <Button 
              onClick={() => reset()} 
              className="w-full text-xs h-9 bg-primary hover:bg-primary/90 text-white font-semibold gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Re-enlisting Process
            </Button>
            
            <div className="grid grid-cols-2 gap-2 w-full mt-1">
              <Button asChild variant="outline" className="text-xs h-9 border-slate-800 text-slate-300 hover:bg-slate-900 font-semibold gap-1.5">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="text-xs h-9 border-slate-800 text-slate-300 hover:bg-slate-900 font-semibold gap-1.5">
                <Link href="/">
                  <Home className="h-3.5 w-3.5" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
