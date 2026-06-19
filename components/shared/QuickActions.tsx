"use client";

import Link from "next/link";
import { Search, MessageSquare, Network, Calendar, BookOpen, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAction {
  name: string;
  label: string;
  icon: string;
  href: string;
  params?: Record<string, string>;
}

interface QuickActionsProps {
  actions: QuickAction[];
  context?: {
    documentId?: string;
    entityId?: string;
    district?: string;
    category?: string;
    year?: number;
    query?: string;
  };
  variant?: "compact" | "full";
}

const iconMap: Record<string, React.ReactNode> = {
  search: <Search className="h-3.5 w-3.5" />,
  message: <MessageSquare className="h-3.5 w-3.5" />,
  network: <Network className="h-3.5 w-3.5" />,
  calendar: <Calendar className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
  map: <MapPin className="h-3.5 w-3.5" />,
};

function buildHref(action: QuickAction, context?: QuickActionsProps["context"]): string {
  const url = new URL(action.href, "http://localhost");
  if (action.params) {
    Object.entries(action.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  if (context) {
    if (context.documentId) url.searchParams.set("document_id", context.documentId);
    if (context.entityId) url.searchParams.set("entity", context.entityId);
    if (context.district) url.searchParams.set("district", context.district);
    if (context.category) url.searchParams.set("category", context.category);
    if (context.year) url.searchParams.set("year", String(context.year));
    if (context.query) url.searchParams.set("q", context.query);
  }
  return `${url.pathname}${url.search}`;
}

export function QuickActions({ actions, context, variant = "compact" }: QuickActionsProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action.name} asChild variant="outline" size="sm" className="text-xs border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white">
            <Link href={buildHref(action, context)}>
              {iconMap[action.icon] || <ArrowRight className="h-3.5 w-3.5" />}
              <span className="ml-1.5">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {actions.map((action) => (
        <Link
          key={action.name}
          href={buildHref(action, context)}
          className="group flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-600 transition-all"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-colors">
            {iconMap[action.icon] || <ArrowRight className="h-4 w-4" />}
          </div>
          <span className="text-sm text-slate-300 group-hover:text-white">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
