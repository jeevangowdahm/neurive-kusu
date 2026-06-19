'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, ArrowRight, Database, Map, FileText, Sparkles, Upload, MessageSquare, Shield, Network, Zap, Eye, Brain, TrendingUp, Calendar, MapPin, Star, ExternalLink, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import type { HomepageData } from '@/lib/homepage-data';

interface HomePageClientProps {
  data: HomepageData | null;
}

export default function HomePageClient({ data }: HomePageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = data?.stats || {
    totalDocuments: 20,
    totalDistricts: 31,
    totalEntities: 25,
    totalRelationships: 0,
    totalCategories: 10,
    totalTimelineEvents: 22
  };

  const featuredDistricts = data?.featuredDistricts || [];
  const featuredCategories = data?.featuredCategories || [];
  const trendingSearches = data?.trendingSearches || [];
  const featuredDocument = data?.featuredDocument;
  const recentTimelineEvents = data?.recentTimelineEvents || [];

  const statItems = [
    { label: 'Documents', value: `${stats.totalDocuments}+`, icon: Database, color: 'blue' as const },
    { label: 'Districts', value: `${stats.totalDistricts}`, icon: Map, color: 'emerald' as const },
    { label: 'Entities', value: `${stats.totalEntities}`, icon: Network, color: 'amber' as const },
    { label: 'Timeline Events', value: `${stats.totalTimelineEvents}`, icon: Calendar, color: 'rose' as const }
  ];

  const quickAccess = [
    { href: '/search', icon: Search, title: 'Hybrid Search', desc: 'AI-Powered Query Engine', color: 'blue' as const },
    { href: '/knowledge-graph', icon: Network, title: 'Knowledge Graph', desc: 'Entity Relationships', color: 'emerald' as const },
    { href: '/upload', icon: Upload, title: 'Ingestion Desk', desc: 'Upload Archives', color: 'amber' as const },
    { href: '/districts', icon: Map, title: 'Districts Explorer', desc: '31 Karnataka Districts', color: 'rose' as const },
    { href: '/chat', icon: MessageSquare, title: 'RAG Chat', desc: 'Talk to Archives', color: 'purple' as const }
  ];

  const features = [
    { icon: Search, title: 'Explainable Hybrid Search', desc: 'Combine vector similarity with keyword matching. Every result explains exactly why it matched.', color: 'blue' as const },
    { icon: MessageSquare, title: 'Conversational RAG Chat', desc: 'Ask questions naturally. Get answers with citations directly referencing the archive.', color: 'emerald' as const },
    { icon: Network, title: 'Knowledge Graph', desc: 'Explore relationships between people, places, events across 500+ years of history.', color: 'amber' as const },
    { icon: FileText, title: 'OCR Pipeline', desc: 'Extract text from handwritten Kannada, Persian, and English manuscripts with 93% accuracy.', color: 'rose' as const },
    { icon: Database, title: 'Vector Embeddings', desc: '1536-dimensional semantic embeddings using OpenAI for superior retrieval.', color: 'purple' as const },
    { icon: Map, title: 'Districts Explorer', desc: 'Browse archives across all 31 Karnataka districts with historical context.', color: 'cyan' as const }
  ];

  const colorClasses: Record<string, { text: string; border: string; bg: string; shadow: string }> = {
    blue: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', shadow: 'shadow-blue-500/10' },
    emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/10' },
    amber: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', shadow: 'shadow-amber-500/10' },
    rose: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', shadow: 'shadow-rose-500/10' },
    purple: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10', shadow: 'shadow-purple-500/10' },
    cyan: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', shadow: 'shadow-cyan-500/10' }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 lg:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center space-y-8">
            <div className={`inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/20 backdrop-blur-xl px-5 py-2 mb-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-300">AI-Powered Karnataka Digital Archive Intelligence</span>
              <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">v3.0</Badge>
            </div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Deciphering Karnataka&apos;s
              </span>
              <br />
              <span className="text-white">Heritage With Neural Intelligence</span>
            </h1>

            <p className={`text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Neurive digitizes, OCRs, and semantic-indexes Karnataka historical archives using{' '}
              <span className="text-blue-400 font-medium">pgvector</span>,{' '}
              <span className="text-emerald-400 font-medium">Gemini AI</span>, and{' '}
              <span className="text-amber-400 font-medium">OpenAI embeddings</span>.
              Query {stats.totalDocuments}+ archival records in under 50ms.
            </p>

            <div className={`pt-4 flex flex-col sm:flex-row justify-center gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl px-10 py-6 font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
                <Link href="/search">
                  <Search className="mr-2 h-5 w-5" />
                  Search Archives
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl px-10 py-6 font-bold text-base backdrop-blur-xl transition-all duration-300">
                <Link href="/demo">
                  <Eye className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className={`pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {statItems.map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 backdrop-blur-xl">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${colorClasses[stat.color].text}`} />
                  <div className={`text-2xl font-bold ${colorClasses[stat.color].text}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="py-16 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickAccess.map((card, i) => {
              const c = colorClasses[card.color];
              return (
                <Link key={i} href={card.href} className="group">
                  <Card className={`h-full border border-slate-800/50 bg-slate-900/20 hover:bg-slate-900/40 backdrop-blur-xl transition-all duration-300 hover:${c.border} hover:shadow-lg hover:${c.shadow}`}>
                    <CardContent className="p-6 text-center">
                      <card.icon className={`h-8 w-8 mx-auto mb-3 ${c.text} group-hover:scale-110 transition-transform`} />
                      <h3 className="text-sm font-bold text-slate-200">{card.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Document + Trending Searches */}
      {(featuredDocument || trendingSearches.length > 0) && (
        <section className="py-12 border-t border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Featured Document */}
              {featuredDocument && (
                <div>
                  <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400">
                    <Star className="h-3 w-3 mr-1" /> Featured Document
                  </Badge>
                  <Link href={`/documents/${featuredDocument.id}`}>
                    <Card className="border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2">{featuredDocument.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">{featuredDocument.year || 'N/A'}</Badge>
                          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400">{featuredDocument.district || 'Unknown'}</Badge>
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400">{featuredDocument.category || 'Unknown'}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Relevance: {Math.round((featuredDocument.relevanceScore || 0) * 100)}% ·
                          {featuredDocument.viewCount} views ·
                          {featuredDocument.entityCount} entities
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Trending Searches */}
              {trendingSearches.length > 0 && (
                <div>
                  <Badge variant="outline" className="mb-4 border-blue-500/30 text-blue-400">
                    <TrendingUp className="h-3 w-3 mr-1" /> Trending Searches
                  </Badge>
                  <div className="space-y-2">
                    {trendingSearches.map((search, i) => (
                      <Link key={i} href={`/search?q=${encodeURIComponent(search.query)}`}>
                        <Card className="border border-slate-800/50 bg-slate-900/20 hover:bg-slate-900/40 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/20">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 w-5">{i + 1}</span>
                              <span className="text-sm text-slate-300">{search.query}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{search.searchCount} searches</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Feature Showcase */}
      <section className="py-24 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-blue-500/30 text-blue-400">Platform Features</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">Complete Archival Intelligence Suite</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Every tool you need to digitize, index, search, and understand Karnataka&apos;s historical records</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const c = colorClasses[feature.color];
              return (
                <Card key={i} className={`relative overflow-hidden border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl transition-all duration-300 hover:${c.border} hover:shadow-lg hover:${c.shadow}`}>
                  <CardContent className="p-6">
                    <feature.icon className={`h-10 w-10 mb-4 ${c.text}`} />
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{feature.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {['AI-Powered', 'Real-time', 'Cross-linked', 'Secure'].map((f, j) => (
                        <Badge key={j} variant="secondary" className={`text-xs ${c.bg} ${c.text} ${c.border}`}>
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Districts */}
      {featuredDistricts.length > 0 && (
        <section className="py-24 border-t border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-12">
              <div>
                <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400">Top Districts</Badge>
                <h2 className="text-3xl font-bold text-white">Karnataka Districts Explorer</h2>
                <p className="text-slate-400 mt-2">Historical archives organized by document count</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredDistricts.map((district, i) => (
                <Link key={i} href={`/districts/${district.id}`}>
                  <Card className="h-full border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white text-sm">{district.name}</h3>
                          <p className="text-xs text-slate-500">{district.nameKannada}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {district.documentCount} records
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{district.historicalSignificance}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span>{district.division}</span>
                        <span className="text-slate-700">·</span>
                        <span>{district.yearFrom}-{district.yearTo}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800">
                <Link href="/districts">
                  Explore All Districts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <section className="py-24 border-t border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-rose-500/30 text-rose-400">Archive Types</Badge>
              <h2 className="text-3xl font-bold text-white mb-4">Browse by Category</h2>
              <p className="text-slate-400">Historical archives organized by document type and subject matter</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredCategories.map((cat, i) => (
                <Link key={i} href={`/search?category=${cat.slug}`}>
                  <Card className="h-full border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-rose-500/30">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-rose-400" />
                      <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cat.documentCount} records</p>
                      {cat.description && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{cat.description}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Timeline Events */}
      {recentTimelineEvents.length > 0 && (
        <section className="py-24 border-t border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400">Timeline</Badge>
              <h2 className="text-3xl font-bold text-white mb-4">Key Historical Events</h2>
              <p className="text-slate-400">Milestones from Karnataka&apos;s rich history</p>
            </div>
            <div className="space-y-4 max-w-3xl mx-auto">
              {recentTimelineEvents.map((event, i) => (
                <Link key={i} href={`/timeline?entity=${event.id}`}>
                  <Card className="border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white">{event.title}</h3>
                        <p className="text-xs text-slate-500">
                          {event.eventDate} · {event.eventType}
                          {event.entityName && ` · ${event.entityName}`}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800">
                <Link href="/timeline">
                  View Full Timeline
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* AI Pipeline Visual */}
      <section className="py-24 bg-slate-950/50 border-t border-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400">How It Works</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">AI-Powered Archival Pipeline</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">From raw manuscript to searchable knowledge in seconds</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {[
              { icon: Upload, label: 'Upload', desc: 'PDF/TIFF/RAW', color: 'blue' },
              { icon: Eye, label: 'OCR', desc: 'Extract Text', color: 'emerald' },
              { icon: Brain, label: 'Chunk', desc: 'Smart Split', color: 'amber' },
              { icon: Zap, label: 'Embed', desc: 'Vector Index', color: 'rose' },
              { icon: Search, label: 'Query', desc: 'Find Results', color: 'purple' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`relative mb-4 p-4 rounded-2xl bg-gradient-to-br from-${step.color}-500/20 to-${step.color}-600/10 border border-${step.color}-500/30 backdrop-blur-xl`}>
                  <step.icon className={`h-8 w-8 text-${step.color}-400`} />
                  {i < 4 && (
                    <div className="hidden md:block absolute top-1/2 -right-8 w-8 h-0.5 bg-gradient-to-r from-slate-700 to-transparent" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{step.label}</h4>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Explore Karnataka&apos;s History?</h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Search through millions of archival records, digitized manuscripts, and historical documents spanning 500+ years of Karnataka&apos;s rich heritage.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl px-12 py-7 font-bold text-base">
              <Link href="/search">
                <Search className="mr-2 h-5 w-5" />
                Start Searching
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 rounded-xl px-12 py-7 font-bold text-base">
              <Link href="/auth/login">
                <Shield className="mr-2 h-5 w-5" />
                Officer Login
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Landmark className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-white">Neurive</span>
              </div>
              <p className="text-xs text-slate-500">Karnataka Digital Archive Intelligence Platform</p>
            </div>
            <div className="flex gap-6 text-xs text-slate-500">
              <Link href="/docs" className="hover:text-slate-300 transition-colors">Documentation</Link>
              <Link href="/api" className="hover:text-slate-300 transition-colors">API</Link>
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            </div>
            <div className="text-xs text-slate-600">{new Date().getFullYear()} Karnataka State Archives</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
