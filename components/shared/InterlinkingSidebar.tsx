"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, MapPin, Tag, ArrowRight, MessageSquare, Search } from "lucide-react";

interface InterlinkingSidebarProps {
  relatedEntities?: any[];
  relatedDistricts?: any[];
  relatedCategories?: any[];
  suggestedFeatures?: any[];
  query?: string;
}

export function InterlinkingSidebar({
  relatedEntities = [],
  relatedDistricts = [],
  relatedCategories = [],
  suggestedFeatures = [],
  query = ""
}: InterlinkingSidebarProps) {
  const hasData = relatedEntities.length > 0 || relatedDistricts.length > 0 || relatedCategories.length > 0;

  if (!hasData && suggestedFeatures.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Related Entities */}
      {relatedEntities.length > 0 && (
        <Card className="border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Network className="h-4 w-4 text-emerald-400" />
              Related Entities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {relatedEntities.slice(0, 6).map((entity, i) => (
                <Link
                  key={i}
                  href={`/knowledge-graph?entity=${encodeURIComponent(entity.name)}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400 border-slate-700">
                      {entity.entity_type}
                    </Badge>
                    <span className="text-sm text-slate-300">{entity.name}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Districts */}
      {relatedDistricts.length > 0 && (
        <Card className="border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-rose-400" />
              Related Districts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {relatedDistricts.slice(0, 5).map((district, i) => (
                <Link
                  key={i}
                  href={`/districts/${district.id}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm text-slate-300">{district.name}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Categories */}
      {relatedCategories.length > 0 && (
        <Card className="border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Tag className="h-4 w-4 text-amber-400" />
              Related Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {relatedCategories.slice(0, 5).map((cat, i) => (
                <Link
                  key={i}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm text-slate-300">{cat.name}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Features */}
      {suggestedFeatures.length > 0 && (
        <Card className="border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <ArrowRight className="h-4 w-4 text-blue-400" />
              Explore Further
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {suggestedFeatures.map((feature, i) => (
                <Link
                  key={i}
                  href={feature.href || `/knowledge-graph?q=${encodeURIComponent(query || "")}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center">
                    {feature.icon === 'message' && <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />}
                    {feature.icon === 'network' && <Network className="h-3.5 w-3.5 text-blue-400" />}
                    {feature.icon === 'calendar' && <ArrowRight className="h-3.5 w-3.5 text-amber-400" />}
                    {feature.icon === 'search' && <Search className="h-3.5 w-3.5 text-rose-400" />}
                  </div>
                  <span className="text-sm text-slate-300">{feature.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
