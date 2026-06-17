'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ARCHIVE_CATEGORIES, KARNATAKA_DISTRICTS } from '@/lib/mock-data';
import { Shield, Sparkles } from 'lucide-react';

export interface MetadataValues {
  title: string;
  category: string;
  district: string;
  year: string;
  language: string;
  visibility: 'public' | 'private' | 'restricted';
  description: string;
  keywords: string;
}

interface MetadataFormProps {
  initialValues: MetadataValues;
  onSubmit: (values: MetadataValues) => void;
  onBack: () => void;
}

export function MetadataForm({ initialValues, onSubmit, onBack }: MetadataFormProps) {
  const [formData, setFormData] = useState<MetadataValues>(initialValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.category && formData.district) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.title && formData.category && formData.district;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Title */}
        <div className="md:col-span-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Document Title *
          </Label>
          <Input 
            value={formData.title} 
            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g., Land Revenue Settlement Deed - Mysuru 1891" 
            className="h-9 bg-white/5 border-white/10 text-xs focus:border-primary/50 text-foreground"
          />
        </div>

        {/* Archival Category */}
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Archival Category *
          </Label>
          <Select 
            value={formData.category} 
            onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}
          >
            <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="Choose Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              {ARCHIVE_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.slug} className="text-xs focus:bg-primary/20 text-foreground">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District Location */}
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            District Location *
          </Label>
          <Select 
            value={formData.district} 
            onValueChange={(v) => setFormData(p => ({ ...p, district: v }))}
          >
            <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 max-h-60 overflow-y-auto">
              {KARNATAKA_DISTRICTS.map(d => (
                <SelectItem key={d.id} value={d.name} className="text-xs focus:bg-primary/20 text-foreground">
                  {d.name} ({d.name_kannada})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Timeline Year (CE)
          </Label>
          <Input 
            value={formData.year} 
            type="number"
            min="1000"
            max="2026"
            onChange={(e) => setFormData(p => ({ ...p, year: e.target.value }))}
            placeholder="e.g., 1891" 
            className="h-9 bg-white/5 border-white/10 text-xs text-foreground"
          />
        </div>

        {/* Language */}
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Archive Language
          </Label>
          <Select 
            value={formData.language} 
            onValueChange={(v) => setFormData(p => ({ ...p, language: v }))}
          >
            <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="kannada" className="text-xs text-foreground">ಕನ್ನಡ (Kannada)</SelectItem>
              <SelectItem value="english" className="text-xs text-foreground">English</SelectItem>
              <SelectItem value="both" className="text-xs text-foreground">Bilingual (Kannada/English)</SelectItem>
              <SelectItem value="other" className="text-xs text-foreground">Other (Hindi/Sanskrit)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visibility */}
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Access Visibility
          </Label>
          <Select 
            value={formData.visibility} 
            onValueChange={(v: any) => setFormData(p => ({ ...p, visibility: v }))}
          >
            <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs text-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="public" className="text-xs text-foreground">🌐 Public Records (Open Select)</SelectItem>
              <SelectItem value="restricted" className="text-xs text-foreground">🔒 Restricted Access (Researchers)</SelectItem>
              <SelectItem value="private" className="text-xs text-foreground">💼 Private Ledger (Archivists only)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Keywords */}
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Keywords (comma separated)
          </Label>
          <Input 
            value={formData.keywords} 
            onChange={(e) => setFormData(p => ({ ...p, keywords: e.target.value }))}
            placeholder="e.g., land, deed, survey, Wadiyar" 
            className="h-9 bg-white/5 border-white/10 text-xs text-foreground"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            Scroll Description
          </Label>
          <Textarea 
            value={formData.description} 
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Provide context or translation comments regarding the scroll..." 
            className="h-24 bg-white/5 border-white/10 text-xs resize-none text-foreground"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="border-white/10 text-muted-foreground hover:bg-white/5"
        >
          Back
        </Button>
        <Button 
          type="submit" 
          disabled={!isFormValid}
          className="gap-2 font-bold text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Review OCR Scans
        </Button>
      </div>
    </form>
  );
}
