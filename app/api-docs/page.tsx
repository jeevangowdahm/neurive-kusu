'use client';
import { safeWriteToClipboard } from '@/lib/security/clipboard';

import { useState } from 'react';
import { Code as Code2, Copy, Check, ChevronDown, ChevronRight, Key, Zap, Database, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/app-layout';

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    safeWriteToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg bg-slate-950 dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span className="text-xs text-slate-400 font-mono">{lang}</span>
        <button onClick={copy} className="text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="p-4 text-xs text-slate-300 overflow-x-auto leading-relaxed font-mono">{code}</pre>
    </div>
  );
}

const ENDPOINTS = [
  {
    method: 'GET', path: '/api/archives', color: 'bg-green-100 text-green-800',
    desc: 'List all archives with pagination and filtering',
    params: [
      { name: 'page', type: 'integer', desc: 'Page number (default: 1)' },
      { name: 'limit', type: 'integer', desc: 'Records per page (max: 100)' },
      { name: 'category', type: 'string', desc: 'Filter by category slug' },
      { name: 'district', type: 'string', desc: 'Filter by district name' },
      { name: 'year_from', type: 'integer', desc: 'Filter records from this year' },
      { name: 'year_to', type: 'integer', desc: 'Filter records to this year' },
      { name: 'language', type: 'string', desc: 'kannada | english | both' },
    ],
  },
  {
    method: 'GET', path: '/api/archives/:id', color: 'bg-green-100 text-green-800',
    desc: 'Get a specific archive record by ID',
    params: [{ name: 'id', type: 'string', desc: 'Archive UUID or accession number' }],
  },
  {
    method: 'POST', path: '/api/search', color: 'bg-blue-100 text-blue-800',
    desc: 'Semantic AI search across all archives',
    params: [
      { name: 'query', type: 'string', desc: 'Search query (Kannada or English)' },
      { name: 'semantic', type: 'boolean', desc: 'Use AI semantic search (default: true)' },
      { name: 'limit', type: 'integer', desc: 'Number of results' },
    ],
  },
  {
    method: 'GET', path: '/api/analytics', color: 'bg-green-100 text-green-800',
    desc: 'Platform analytics and statistics',
    params: [],
  },
];

export default function ApiDocsPage() {
  const [openEndpoint, setOpenEndpoint] = useState<number | null>(0);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">API Documentation</h1>
            <Badge variant="secondary">v1.0</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Integrate Karnataka Archive data into your applications
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-5">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h3>
                {['Authentication', 'Archives API', 'Search API', 'Analytics API', 'Rate Limits', 'SDKs'].map((item) => (
                  <button key={item} className="block w-full text-left text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors">
                    {item}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border bg-primary/5">
              <CardContent className="p-4">
                <Key className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs font-medium text-foreground mb-1">Get API Key</p>
                <p className="text-xs text-muted-foreground mb-2">Free for researchers and institutions</p>
                <Button size="sm" className="w-full text-xs h-7">Request Access</Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Base URL */}
            <Card className="border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Base URL</p>
                <code className="text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded block">
                  https://api.neurive.karnataka.gov.in/v1
                </code>
              </CardContent>
            </Card>

            {/* Auth */}
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">All API requests require an API key in the header:</p>
                <CodeBlock lang="http" code={`GET /v1/archives
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`} />
              </CardContent>
            </Card>

            {/* Endpoints */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Endpoints</h2>
              <div className="space-y-2">
                {ENDPOINTS.map((ep, i) => (
                  <Card key={i} className="border overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => setOpenEndpoint(openEndpoint === i ? null : i)}
                    >
                      <Badge className={`${ep.color} text-[11px] font-mono shrink-0`}>{ep.method}</Badge>
                      <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                      <p className="text-xs text-muted-foreground hidden sm:block flex-1">{ep.desc}</p>
                      {openEndpoint === i ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                    {openEndpoint === i && (
                      <CardContent className="px-4 pb-4 pt-0 border-t">
                        <p className="text-sm text-muted-foreground mb-3">{ep.desc}</p>
                        {ep.params.length > 0 && (
                          <>
                            <p className="text-xs font-semibold text-foreground mb-2">Parameters</p>
                            <div className="space-y-1.5 mb-4">
                              {ep.params.map((p) => (
                                <div key={p.name} className="flex items-start gap-3 text-xs">
                                  <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{p.name}</code>
                                  <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{p.type}</span>
                                  <span className="text-muted-foreground">{p.desc}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        <p className="text-xs font-semibold text-foreground mb-2">Example Response</p>
                        <CodeBlock code={JSON.stringify({
                          success: true,
                          data: {
                            id: "arch-000001",
                            accession_number: "KAR-00000001",
                            title: "Survey Settlement Record - Mysuru 1891",
                            year: 1891,
                            district: "Mysuru",
                            category: "Land Records",
                            language: "kannada",
                            has_ocr: true,
                          },
                          meta: { page: 1, limit: 20, total: 1000000 }
                        }, null, 2)} />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Rate Limits */}
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4">Plan</th>
                        <th className="text-left py-2 pr-4">Requests/min</th>
                        <th className="text-left py-2 pr-4">Requests/day</th>
                        <th className="text-left py-2">Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { plan: 'Free', min: 30, day: 1000, access: 'Public records only' },
                        { plan: 'Research', min: 100, day: 10000, access: 'Full access' },
                        { plan: 'Institutional', min: 300, day: 50000, access: 'Full access + bulk' },
                      ].map(({ plan, min, day, access }) => (
                        <tr key={plan}>
                          <td className="py-2.5 pr-4 font-medium text-foreground">{plan}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{min}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{day.toLocaleString()}</td>
                          <td className="py-2.5 text-muted-foreground">{access}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
