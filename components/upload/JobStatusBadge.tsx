'use client';

import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  let colorClass = 'bg-white/10 text-muted-foreground border-white/5';
  let icon = <Clock className="h-3 w-3 shrink-0" />;

  switch (status) {
    case 'Completed':
    case 'active':
      colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      icon = <CheckCircle2 className="h-3 w-3 shrink-0" />;
      break;
    case 'Failed':
      colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      icon = <AlertCircle className="h-3 w-3 shrink-0" />;
      break;
    case 'Pending':
      colorClass = 'bg-white/15 text-muted-foreground border-white/10';
      icon = <Clock className="h-3 w-3 shrink-0" />;
      break;
    default:
      // Active steps: OCR Processing, Chunking Text, Generating Embeddings, etc.
      colorClass = 'bg-primary/10 text-primary border-primary/20';
      icon = <Loader2 className="h-3 w-3 shrink-0 animate-spin" />;
      break;
  }

  return (
    <Badge 
      variant="outline" 
      className={`text-[10px] py-0.5 px-2 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all
        ${colorClass}`}
    >
      {icon}
      {status}
    </Badge>
  );
}
