'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface AdminAccessGuardProps {
  children: React.ReactNode;
}

export function AdminAccessGuard({ children }: AdminAccessGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAuthorized(false);
          setLoading(false);
          router.push('/dashboard');
          return;
        }

        setUserEmail(user.email || null);

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const isAdmin = profile?.role === 'admin' || 
                        ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(user.email || '');

        if (isAdmin) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          setTimeout(() => router.push('/dashboard'), 3000);
        }
      } catch (err) {
        console.error('Admin security validation failed:', err);
        setAuthorized(false);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400 bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-mono">Verifying administrative access clearance...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto min-h-[60vh] flex flex-col justify-center bg-slate-950">
        <Card className="border-red-500/20 bg-slate-900/40 backdrop-blur-md overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
          <CardContent className="p-8 text-center flex flex-col items-center select-none">
            <Shield className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100 font-serif mb-2">Access Denied</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Your account ({userEmail || 'Guest'}) does not have the necessary permissions to access this administrative zone. This event has been logged.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full text-xs h-9">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
