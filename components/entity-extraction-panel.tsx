'use client';

import { useState } from 'react';
import { User, MapPin, Calendar, Building, BookOpen, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ExtractedEntity {
  name: string;
  nameKannada?: string;
  type: 'person' | 'place' | 'event' | 'organization' | 'date' | 'artifact';
  description?: string;
  mentions: number;
  relatedEntities?: Array<{ name: string; type: string; relation: string }>;
}

/**
 * Entity Extraction Panel
 * Shows AI-extracted entities from archive documents
 */
export function EntityExtractionPanel({ entities }: { entities: ExtractedEntity[] }) {
  const [selectedEntity, setSelectedEntity] = useState<ExtractedEntity | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const typeConfig: Record<string, { icon: typeof User; color: string; bg: string; label: string }> = {
    person: { icon: User, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30', label: 'People' },
    place: { icon: MapPin, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30', label: 'Places' },
    event: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'Events' },
    organization: { icon: Building, color: 'bg-emerald-50 dark:bg-emerald-950/30', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Organizations' },
    date: { icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', label: 'Dates' },
    artifact: { icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30', label: 'Artifacts' },
  };

  const filteredEntities = filterType === 'all'
    ? entities
    : entities.filter((e) => e.type === filterType);

  const entityTypes = ['all', ...new Set(entities.map((e) => e.type))];

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            AI Entity Extraction
            <Badge variant="secondary" className="text-[10px]">{entities.length} found</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Type filters */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                filterType === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border'
              }`}
            >
              {type === 'all' ? 'All' : typeConfig[type]?.label || type}
            </button>
          ))}
        </div>

        {/* Entity list */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {filteredEntities.map((entity) => {
            const config = typeConfig[entity.type] || typeConfig.person;
            const Icon = config.icon;
            const isSelected = selectedEntity?.name === entity.name;

            return (
              <button
                key={entity.name}
                onClick={() => setSelectedEntity(isSelected ? null : entity)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all hover:bg-muted/50 ${
                  isSelected ? 'bg-muted ring-1 ring-primary/20' : ''
                }`}
              >
                <div className={`p-1 rounded ${config.bg}`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">{entity.name}</span>
                    {entity.nameKannada && (
                      <span className="text-[10px] text-muted-foreground truncate kannada-text">{entity.nameKannada}</span>
                    )}
                  </div>
                  {entity.description && (
                    <p className="text-[10px] text-muted-foreground truncate">{entity.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] h-4">{entity.mentions}x</Badge>
                  <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected entity detail */}
        {selectedEntity && selectedEntity.relatedEntities && selectedEntity.relatedEntities.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Related</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedEntity.relatedEntities.map((rel) => (
                <Badge
                  key={rel.name}
                  variant="secondary"
                  className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {rel.name}
                  <span className="text-muted-foreground">({rel.relation})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
