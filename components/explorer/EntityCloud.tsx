'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface EntityCloudProps {
  entities: string[];
  type?: 'person' | 'place' | 'event' | 'all';
}

export function EntityCloud({ entities, type = 'all' }: EntityCloudProps) {
  if (!entities || entities.length === 0) {
    return (
      <div className="bg-slate-950/20 border border-slate-900 rounded-lg p-5 text-center select-none">
        <span className="text-xs text-slate-500 font-mono">No relevant figures index cataloged.</span>
      </div>
    );
  }

  const iconConfig = {
    person: { icon: User, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    place: { icon: MapPin, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    event: { icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    all: { icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  };

  const config = iconConfig[type] || iconConfig.all;
  const Icon = config.icon;

  return (
    <div className="flex flex-wrap gap-1.5 select-none font-sans">
      {entities.map((name, idx) => (
        <Link key={idx} href={`/search?q=${encodeURIComponent(name)}`}>
          <Badge
            variant="secondary"
            className={`text-[10px] font-medium py-1 px-2.5 cursor-pointer rounded-md border hover:scale-102 hover:border-slate-600 transition-all gap-1.5 ${config.color}`}
          >
            <Icon className="h-3 w-3" />
            <span>{name}</span>
          </Badge>
        </Link>
      ))}
    </div>
  );
}
