'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { retryProcessingJob } from '@/lib/upload-service';
import { audioSynth } from '@/lib/audio';

interface RetryButtonProps {
  jobId: string;
  documentId: string;
  onRetryStarted: () => void;
  onRetryFailed: (errorMsg: string) => void;
}

export function RetryButton({ jobId, documentId, onRetryStarted, onRetryFailed }: RetryButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    audioSynth.playTypewriterClick(true);
    setLoading(true);
    onRetryStarted();

    try {
      await retryProcessingJob(jobId, documentId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Retry failed';
      onRetryFailed(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={loading}
      className="gap-2 font-bold text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md shadow-rose-950/20 active:scale-95 transition-all"
    >
      <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Resetting Archive Data...' : 'Retry Ingestion Press'}
    </Button>
  );
}
