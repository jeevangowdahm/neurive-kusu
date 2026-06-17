'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Sparkles, Waves, Trees, Layers, Palette, Archive, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { THEMES, THEME_SWATCHES } from '@/components/theme-provider';
import { audioSynth } from '@/lib/audio';

const THEME_ICONS: Record<string, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  material: <Layers className="h-4 w-4" />,
  glassmorphism: <Palette className="h-4 w-4" />,
  aurora: <Sparkles className="h-4 w-4" />,
  ocean: <Waves className="h-4 w-4" />,
  forest: <Trees className="h-4 w-4" />,
  skeuomorphic: <Archive className="h-4 w-4" />,
};

function ThemeSwatch({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-0.5 ml-auto">
      {colors.slice(0, 4).map((color, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full border border-black/10"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sound configuration preference
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    setSoundEnabled(soundPref);
    audioSynth.setSoundEnabled(soundPref);
  }, []);

  const toggleSound = () => {
    const nextSoundState = !soundEnabled;
    setSoundEnabled(nextSoundState);
    audioSynth.setSoundEnabled(nextSoundState);
    localStorage.setItem('neurive_sound_fx', String(nextSoundState));
    
    // Play sweet chime confirmation if sound is enabled
    if (nextSoundState) {
      setTimeout(() => {
        audioSynth.playHologramChime(false);
      }, 50);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    if (soundEnabled) {
      if (themeId === 'skeuomorphic') {
        audioSynth.playPaperRustle();
      } else if (themeId === 'glassmorphism' || themeId === 'aurora') {
        audioSynth.playHologramChime(true);
      } else {
        audioSynth.playHologramChime(false);
      }
    }
  };

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 rounded-lg hover:bg-secondary transition-colors duration-200 btn-smooth"
          title="Switch theme & sound"
        >
          <div className="transition-all duration-300">
            {THEME_ICONS[theme || 'light']}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span>Archive Visual Theme</span>
          </div>
        </DropdownMenuLabel>
        
        {/* Dynamic Sound FX Toggle Card */}
        <div className="px-2 py-1.5 mx-1 mb-1 rounded-md bg-primary/5 border border-primary/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Archive Sound FX</span>
            <span className="text-[9px] text-muted-foreground">Typewriter clacks & chimes</span>
          </div>
          <Button 
            onClick={toggleSound} 
            size="icon" 
            variant="ghost" 
            className={`h-7 w-7 rounded-md border ${
              soundEnabled 
                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                : 'text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <DropdownMenuSeparator />

        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => handleThemeSelect(t.id)}
            className={`cursor-pointer flex items-center gap-3 py-2.5 ${
              theme === t.id ? 'bg-accent text-accent-foreground' : ''
            } transition-colors duration-200`}
          >
            <div className="transition-transform duration-200">
              {THEME_ICONS[t.id]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.description}</p>
            </div>
            <ThemeSwatch colors={THEME_SWATCHES[t.id] || []} />
            {theme === t.id && (
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

