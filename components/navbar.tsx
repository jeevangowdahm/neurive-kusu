'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Search, Menu, X, Bell, User,
  ChevronDown, BookOpen, LogIn, LogOut, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ParticleLogo } from '@/components/particle-logo';
import { supabase } from '@/lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      if (data?.user) {
        supabase.from('users').select('full_name').eq('id', data.user.id).maybeSingle()
          .then(({ data: profile }) => {
            setUserName(profile?.full_name || data.user.email || '');
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('users').select('full_name').eq('id', session.user.id).maybeSingle()
          .then(({ data: profile }) => {
            setUserName(profile?.full_name || session.user.email || '');
          });
      } else {
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserName('');
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/documents', label: 'Documents' },
    { href: '/search', label: 'AI Search' },
    { href: '/admin/agent', label: 'AI Archivist' },
    { href: '/categories', label: 'Categories' },
    { href: '/districts', label: 'Districts' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/about', label: 'About' },
  ];

  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600">
              <ParticleLogo />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-foreground">Neurive</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Karnataka Archive</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${pathname === link.href
                    ? 'text-primary bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link href="/search">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 text-muted-foreground">
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Search archives...</span>
                <kbd className="text-xs bg-muted px-1 rounded">⌘K</kbd>
              </Button>
            </Link>

            <ThemeSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    {user ? (
                      <span className="text-[10px] font-bold text-primary">{initials}</span>
                    ) : (
                      <User className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  {user && <span className="text-xs text-muted-foreground hidden sm:block max-w-[80px] truncate">{userName}</span>}
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/upload" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Upload Archive
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {(user.email === 'jeevangowdahm6@gmail.com' || user.email === 'jeevangowda082007@gmail.com') && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Create Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/upload" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Upload Archive
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${pathname === link.href
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t space-y-1">
            <Link href="/upload" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
              Upload Archive
            </Link>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
              Dashboard
            </Link>
            {user && (user.email === 'jeevangowdahm6@gmail.com' || user.email === 'jeevangowda082007@gmail.com') && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-secondary">
                Admin Panel
              </Link>
            )}
            {user ? (
              <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-secondary">
                Sign Out
              </button>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
