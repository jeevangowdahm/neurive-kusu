'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export const THEMES = [
  { id: 'light', name: 'Light', description: 'Clean and bright' },
  { id: 'dark', name: 'Dark', description: 'Easy on the eyes' },
  { id: 'material', name: 'Material', description: 'Google Material Design' },
  { id: 'glassmorphism', name: 'Glass', description: 'Frosted glass with depth' },
  { id: 'aurora', name: 'Aurora', description: 'Purple & Cyan vibes' },
  { id: 'ocean', name: 'Ocean', description: 'Deep blue theme' },
  { id: 'forest', name: 'Forest', description: 'Green & earth tones' },
  { id: 'skeuomorphic', name: 'Skeuomorphic', description: 'Tactile wood, leather & brass' },
];

export const THEME_SWATCHES: Record<string, string[]> = {
  light: ['#ffffff', '#1a1a2e', '#1565c0', '#e3f2fd'],
  dark: ['#0d1117', '#e6edf3', '#4493f8', '#161b22'],
  material: ['#fafafa', '#212121', '#1976d2', '#f5f5f5'],
  glassmorphism: ['#eef1f5', '#262630', '#3b82f6', '#f8fafc'],
  aurora: ['#1a1033', '#e6edf3', '#a855f7', '#14b8a6'],
  ocean: ['#0a192f', '#e6edf3', '#0091ea', '#26a69a'],
  forest: ['#141e0d', '#e8f0e0', '#2e7d32', '#ef6c00'],
  skeuomorphic: ['#8b5a2b', '#f5ebd6', '#3b2f2f', '#cda45e'],
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
