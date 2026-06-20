"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-800/50 rounded-lg p-5 bg-slate-900/30 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 bg-slate-800" />
            <Skeleton className="h-5 w-16 bg-slate-800" />
          </div>
          <Skeleton className="h-5 w-3/4 bg-slate-800" />
          <Skeleton className="h-4 w-full bg-slate-800" />
          <Skeleton className="h-4 w-2/3 bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="border border-slate-800/50 rounded-lg p-5 bg-slate-900/30 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24 bg-slate-800" />
        <Skeleton className="h-5 w-16 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-3/4 bg-slate-800" />
      <Skeleton className="h-4 w-full bg-slate-800" />
      <Skeleton className="h-4 w-2/3 bg-slate-800" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-28 bg-slate-800" />
        <Skeleton className="h-8 w-24 bg-slate-800" />
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="border border-slate-800/50 rounded-lg p-6 bg-slate-900/30">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-slate-800" />
          <Skeleton className="h-6 w-16 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-8 w-64 bg-slate-800" />
      <Skeleton className="h-4 w-96 bg-slate-800" />
    </div>
  );
}
