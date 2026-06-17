'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Home, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="max-w-md w-full border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden relative shadow-2xl z-10">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-blue-500" />
        <CardContent className="p-8 text-center flex flex-col items-center select-none">
          <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight font-serif mb-2">
            404
          </h2>
          <span className="text-[10px] font-bold font-mono uppercase text-slate-500 block mb-2 tracking-wider">Record Not Found</span>
          
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            The page you are looking for does not exist in the Karnataka Archives platform or may have been restricted under regional clearance rules.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button asChild variant="default" className="text-xs h-9 bg-primary text-white hover:bg-primary/90 font-semibold gap-1.5">
              <Link href="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-xs h-9 border-slate-800 text-slate-300 hover:bg-slate-900 font-semibold gap-1.5">
              <Link href="/">
                <Home className="h-3.5 w-3.5" />
                Return Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
