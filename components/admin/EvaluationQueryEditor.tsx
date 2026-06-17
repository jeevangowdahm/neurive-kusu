'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';

interface EvaluationQueryEditorProps {
  queries: any[];
  onAddQuery: (queryData: {
    query: string;
    expectedIds: string;
    category?: string;
    district?: string;
    language?: string;
  }) => Promise<void>;
  onDeleteQuery: (id: string) => Promise<void>;
  showAddForm: boolean;
  onToggleAddForm: () => void;
}

export function EvaluationQueryEditor({
  queries,
  onAddQuery,
  onDeleteQuery,
  showAddForm,
  onToggleAddForm
}: EvaluationQueryEditorProps) {
  // New query form states
  const [newQueryText, setNewQueryText] = useState('');
  const [newExpectedIds, setNewExpectedIds] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueryText.trim() || !newExpectedIds.trim()) return;

    await onAddQuery({
      query: newQueryText.trim(),
      expectedIds: newExpectedIds.trim(),
      category: newCategory.trim() || undefined,
      district: newDistrict.trim() || undefined,
      language: newLanguage.trim() || undefined
    });

    // Reset fields on success
    setNewQueryText('');
    setNewExpectedIds('');
    setNewCategory('');
    setNewDistrict('');
    setNewLanguage('');
  };

  return (
    <Card className="border bg-slate-900/20 border-slate-900 p-4">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between border-b border-slate-900 select-none">
        <div>
          <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
            Baseline Evaluation Queries Registry ({queries.length})
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-500 mt-0.5">
            Define ground-truth expected documents to verify retrieval relevance.
          </CardDescription>
        </div>
        <Button 
          size="sm" 
          onClick={onToggleAddForm}
          className="h-7 text-[10px] px-3 font-semibold gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAddForm ? 'Close Editor' : 'Register Query'}
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 pt-3">
        {/* Register form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-3 mb-4 select-none">
            <span className="text-[9.5px] font-mono font-bold text-primary uppercase block">New Query Registration Form</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-slate-500 uppercase font-mono">Query Text *</label>
                <Input
                  required
                  placeholder="e.g. Land survey records in Mysuru"
                  value={newQueryText}
                  onChange={(e) => setNewQueryText(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs h-8 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-slate-500 uppercase font-mono">Expected Document IDs (Comma-separated) *</label>
                <Input
                  required
                  placeholder="e.g. doc-id-1, doc-id-2, arch-3"
                  value={newExpectedIds}
                  onChange={(e) => setNewExpectedIds(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs h-8 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-mono">Category</label>
                <Input
                  placeholder="e.g. land-records"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs h-8 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-mono">District</label>
                <Input
                  placeholder="e.g. Mysuru"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs h-8 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-mono">Language</label>
                <Input
                  placeholder="e.g. kannada"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs h-8 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs font-semibold px-4 bg-primary text-white hover:bg-primary/90">
                Save & Register
              </Button>
            </div>
          </form>
        )}

        {/* Queries table */}
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900">
                <th className="py-2 pr-3 font-semibold">Test Query Text</th>
                <th className="py-2 pr-3 font-semibold hidden md:table-cell">Scoping Filters</th>
                <th className="py-2 pr-3 font-semibold">Expected IDs</th>
                <th className="py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {queries.length > 0 ? (
                queries.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-900/10">
                    <td className="py-2.5 pr-3 text-slate-200 font-medium font-sans">{q.query}</td>
                    <td className="py-2.5 pr-3 text-slate-400 hidden md:table-cell">
                      {q.district && <Badge variant="outline" className="text-[9px] mr-1 scale-95 border-slate-800 text-slate-500">{q.district}</Badge>}
                      {q.category && <Badge variant="outline" className="text-[9px] mr-1 scale-95 border-slate-800 text-slate-500">{q.category.replace(/-/g, ' ')}</Badge>}
                      {q.language && <Badge variant="outline" className="text-[9px] scale-95 border-slate-800 text-slate-500 uppercase">{q.language}</Badge>}
                      {!q.district && !q.category && !q.language && <span className="text-[10px] text-slate-600 italic">None</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {q.expected_document_ids?.length || 0} files
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteQuery(q.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                        title="Delete query record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-600 font-mono text-xs">
                    No registered evaluation queries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
