"use client";

import { TriangleAlert as AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: boolean;
}

export function ErrorState({ title = "Something went wrong", message, onRetry, onGoHome = false }: ErrorStateProps) {
  return (
    <Card className="border border-red-500/20 bg-red-950/10 backdrop-blur-xl">
      <CardContent className="p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-red-200 mb-2">{title}</h3>
        <p className="text-sm text-red-300/70 max-w-md mx-auto mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          {onGoHome && (
            <Button asChild variant="ghost" className="text-red-400/70 hover:text-red-300">
              <a href="/">Go Home</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
