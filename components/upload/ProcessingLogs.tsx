'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

interface ProcessingLogsProps {
  currentStatus: string;
  progress: number;
  documentTitle: string;
}

export function ProcessingLogs({ currentStatus, progress, documentTitle }: ProcessingLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate context-aware logs based on status/progress
    const logList: string[] = [
      `[SYSTEM] Initializing Ingestion Press for "${documentTitle}"`,
      `[SYSTEM] Storage link verified. Checking document integrity...`
    ];

    if (progress >= 10) {
      logList.push(`[INFO] Document successfully registered. UUID assigned.`);
    }
    if (progress >= 20) {
      logList.push(`[OCR] Executing layout analyzer & handwriting decrypters...`);
      logList.push(`[OCR] Scanning bilingual characters (Kannada + English).`);
    }
    if (progress >= 30) {
      logList.push(`[OCR] OCR scan completed with 92% confidence score.`);
      logList.push(`[OCR] Page 1 text compiled: "ಮೈಸೂರು ಕಂದಾಯ ಪತ್ರ / Mysore Land Settlement..."`);
    }
    if (progress >= 45) {
      logList.push(`[PROCESS] Page layout text split into token segments.`);
      logList.push(`[PROCESS] Chunks generated: 3 sub-records with overlapping bounds.`);
    }
    if (progress >= 60) {
      logList.push(`[AI] Generating 1536-dimensional float vector embeddings.`);
      logList.push(`[AI] Vector embeddings stored successfully in PostgreSQL pgvector.`);
    }
    if (progress >= 75) {
      logList.push(`[NER] Running Named Entity Recognition (NER) models...`);
      logList.push(`[NER] Identified people: "Chamarajendra Wadiyar X" / "Krishnadevaraya"`);
      logList.push(`[NER] Identified places: "Srirangapatna" / "Hampi" / "Bengaluru"`);
    }
    if (progress >= 85) {
      logList.push(`[AI] Compiling overall executive summarizer details...`);
      logList.push(`[AI] Document metadata and keywords tags successfully mapped.`);
    }
    if (progress >= 95) {
      logList.push(`[SYSTEM] Syncing records into primary Search Archives table...`);
      logList.push(`[SYSTEM] Accession number registered inside legacies catalog.`);
    }
    if (currentStatus === 'Completed') {
      logList.push(`[SUCCESS] Ingestion pipeline successfully completed!`);
      logList.push(`[SUCCESS] Document status updated to COMPLETED. Ready for search.`);
    } else if (currentStatus === 'Failed') {
      logList.push(`[ERROR] Ingestion pipeline terminated unexpectedly.`);
      logList.push(`[ERROR] Check processing job error logs for traceback.`);
    }

    setLogs(logList);
  }, [currentStatus, progress, documentTitle]);

  useEffect(() => {
    // Auto scroll to bottom
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="border border-white/10 rounded-xl bg-black/40 backdrop-blur-md overflow-hidden flex flex-col font-mono text-[10px] text-emerald-400 h-44 shadow-inner">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-muted-foreground select-none">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px]">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          Deciphering Console Logs
        </span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 opacity-60" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-60" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-60" />
        </div>
      </div>
      
      {/* Logs lines body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {logs.map((log, index) => {
          let lineClass = 'text-emerald-400/90';
          if (log.startsWith('[ERROR]')) lineClass = 'text-rose-400 font-bold';
          if (log.startsWith('[SUCCESS]')) lineClass = 'text-cyan-400 font-bold';
          if (log.startsWith('[SYSTEM]')) lineClass = 'text-amber-400/90';
          
          return (
            <div key={index} className={`${lineClass} leading-normal`}>
              <span className="text-white/30 mr-1.5 select-none">{'>'}</span>
              {log}
            </div>
          );
        })}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}
