'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, MapPin, User, Building, BookOpen } from 'lucide-react';

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  type: 'person' | 'place' | 'event' | 'document' | 'organization';
  entityId?: string;
}

/**
 * Animated Timeline
 * Displays historical events with scroll-triggered animations
 */
export function AnimatedTimeline({ events }: { events: TimelineEvent[] }) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [events]);

  const typeConfig: Record<string, { icon: typeof Calendar; color: string; bg: string }> = {
    person: { icon: User, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    place: { icon: MapPin, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    event: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    document: { icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    organization: { icon: Building, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const config = typeConfig[event.type] || typeConfig.event;
          const Icon = config.icon;
          const isVisible = visibleItems.has(index);

          return (
            <div
              key={`${event.year}-${index}`}
              ref={(el) => { itemRefs.current[index] = el; }}
              data-index={index}
              className={`relative pl-16 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              {/* Timeline dot */}
              <div className={`absolute left-4 top-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${config.bg} ${
                isVisible ? 'scale-100' : 'scale-0'
              } transition-transform duration-500`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Icon className={`h-2.5 w-2.5 ${config.color}`} />
              </div>

              {/* Event card */}
              <div className={`rounded-lg border p-4 hover:shadow-md transition-all ${config.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-muted-foreground">{event.year}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${config.color}`}>
                    {event.type}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{event.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
