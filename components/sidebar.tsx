'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Chrome as Home, Search, FolderOpen, Map, Upload, LayoutDashboard, ChartBar as BarChart3, Settings, BookOpen, Database, Compass, Flag, Scale, Star, FileText, Users, Calculator, MapPin, CircleHelp as HelpCircle, Phone, Code as Code2, ChevronRight, BookMarked, MessageCircle, Heart, Network, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

const mainNav = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'AI Search', badge: 'AI' },
  { href: '/chat', icon: MessageCircle, label: 'AI Chat', badge: 'AI' },
  { href: '/knowledge-graph', icon: Network, label: 'Knowledge Graph', badge: 'Visual' },
  { href: '/timeline', icon: Calendar, label: 'Timeline' },
  { href: '/admin/agent', icon: Compass, label: 'AI Archivist', badge: 'Agent' },
  { href: '/categories', icon: FolderOpen, label: 'Categories' },
  { href: '/districts', icon: Map, label: 'Districts' },
];

const archiveTypes = [
  { href: '/categories/land-records', icon: MapPin, label: 'Land Records', color: 'text-sky-600' },
  { href: '/categories/court-records', icon: Scale, label: 'Court Records', color: 'text-red-600' },
  { href: '/categories/temple-records', icon: Star, label: 'Temple Records', color: 'text-amber-600' },
  { href: '/categories/gazette-notifications', icon: FileText, label: 'Gazettes', color: 'text-violet-600' },
  { href: '/categories/manuscripts', icon: BookOpen, label: 'Manuscripts', color: 'text-emerald-600' },
  { href: '/categories/kannada-literature', icon: BookMarked, label: 'Literature', color: 'text-cyan-600' },
];

const userNav = [
  { href: '/upload', icon: Upload, label: 'Upload Archive' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { href: '/bookmarks', icon: Heart, label: 'My Bookmarks' },
];

const infoNav = [
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin', icon: Settings, label: 'Admin Panel' },
  { href: '/about', icon: Database, label: 'About Neurive' },
  { href: '/contact', icon: Phone, label: 'Contact' },
  { href: '/api-docs', icon: Code2, label: 'API Docs' },
];

function NavItem({ href, icon: Icon, label, badge, color }: {
  href: string; icon: React.ElementType; label: string; badge?: string; color?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]));

  return (
    <Link
      href={href}
      className={cn(
        'sidebar-link group',
        isActive && 'sidebar-link-active'
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', color || (isActive ? 'text-accent-foreground' : 'text-muted-foreground/70'))} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
          {badge}
        </Badge>
      )}
      {isActive && <ChevronRight className="h-3 w-3 text-accent-foreground/50" />}
    </Link>
  );
}

export function Sidebar() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.email === 'jeevangowdahm6@gmail.com' || user?.email === 'jeevangowda082007@gmail.com';

  const filteredInfoNav = infoNav.filter(item => {
    if (item.href === '/admin') return isAdmin;
    return true;
  });

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-thin">
      <div className="flex flex-col gap-6 p-4">
        {/* Main */}
        <div>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Navigation
          </p>
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>

        {/* Archive Types */}
        <div>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Archive Types
          </p>
          <div className="space-y-0.5">
            {archiveTypes.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>

        {/* User */}
        <div>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            My Account
          </p>
          <div className="space-y-0.5">
            {userNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Platform
          </p>
          <div className="space-y-0.5">
            {filteredInfoNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t">
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs font-medium text-foreground mb-1">Karnataka Archive</p>
          <p className="text-[11px] text-muted-foreground">1,000,000+ records digitized</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">75%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
