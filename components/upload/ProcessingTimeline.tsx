'use client';

import { Check, Clock, AlertTriangle } from 'lucide-react';

export const PIPELINE_STEPS = [
  { status: 'Uploaded', label: 'Scroll Uploaded', desc: 'Securely saved in Supabase storage' },
  { status: 'OCR Processing', label: 'OCR Processing', desc: 'Bilingual page layout scanning' },
  { status: 'Text Extracted', label: 'Text Extracted', desc: 'Transcripts compiled and saved' },
  { status: 'Chunking Text', label: 'Chunking Text', desc: 'Segmenting text into semantic tokens' },
  { status: 'Generating Embeddings', label: 'Generating Embeddings', desc: 'Creating 1536-dim vector embeddings' },
  { status: 'Extracting Entities', label: 'Extracting Entities', desc: 'Mapping people, places, and timelines' },
  { status: 'Generating Summary', label: 'Generating Summary', desc: 'Generating AI executive summary' },
  { status: 'Updating Search Index', label: 'Updating Search Index', desc: 'Syncing with public Archives index' },
  { status: 'Completed', label: 'Pipeline Completed', desc: 'Record fully cataloged and indexed' }
];

interface ProcessingTimelineProps {
  currentStatus: string;
  progress: number;
  errorMessage?: string | null;
}

export function ProcessingTimeline({ currentStatus, progress, errorMessage }: ProcessingTimelineProps) {
  // Find current step index
  const activeIndex = PIPELINE_STEPS.findIndex(step => step.status === currentStatus);
  const isFailed = currentStatus === 'Failed';

  return (
    <div className="space-y-4">
      {/* Percentage Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Ingestion Press Sweeping</span>
          <span className="font-mono text-primary font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              isFailed ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Vertical Steps Timeline */}
      <div className="relative pl-6 space-y-4 border-l border-white/10 ml-2.5 pt-1">
        {PIPELINE_STEPS.map((step, idx) => {
          const isCompleted = activeIndex > idx || currentStatus === 'Completed';
          const isActive = activeIndex === idx && !isFailed;
          const isStepFailed = isFailed && activeIndex === idx;

          let icon = <Clock className="h-3.5 w-3.5 text-muted-foreground opacity-50" />;
          let circleBg = 'bg-white/5 border-white/10';
          let textColor = 'text-muted-foreground';

          if (isCompleted) {
            icon = <Check className="h-3.5 w-3.5 text-emerald-400" />;
            circleBg = 'bg-emerald-500/10 border-emerald-500/30';
            textColor = 'text-foreground';
          } else if (isActive) {
            icon = (
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
              </span>
            );
            circleBg = 'bg-primary/20 border-primary/50';
            textColor = 'text-primary font-semibold';
          } else if (isStepFailed) {
            icon = <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
            circleBg = 'bg-rose-500/15 border-rose-500/40';
            textColor = 'text-rose-400 font-semibold';
          }

          return (
            <div key={step.status} className="relative flex gap-3 text-xs leading-normal animate-slide-up">
              
              {/* Timeline marker node */}
              <div 
                className={`absolute -left-[31px] w-5 h-5 rounded-full border flex items-center justify-center backdrop-blur-md transition-all
                  ${circleBg}`}
              >
                {icon}
              </div>

              <div>
                <p className={`${textColor} font-serif font-bold text-[13px] tracking-wide`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground opacity-80 mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Display Error Message */}
      {isFailed && errorMessage && (
        <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300 font-semibold animate-slide-up flex gap-2 items-start leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
          <div>
            <p className="font-bold text-rose-400">Ingestion Inoperable</p>
            <p className="opacity-90 font-mono mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
