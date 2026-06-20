"use client";

import { FileSearch, Search, BookOpen, CircleAlert as AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface EmptyStateProps {
  icon?: "search" | "documents" | "archive" | "error" | "inbox";
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  search: Search,
  documents: BookOpen,
  archive: FileSearch,
  error: AlertCircle,
  inbox: Inbox,
};

export function EmptyState({ icon = "search", title, description, action, secondaryAction }: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <Card className="border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">{description}</p>
        <div className="flex gap-3 justify-center">
          {action && (
            <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" className="text-slate-500 hover:text-slate-300" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
