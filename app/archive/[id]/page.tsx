'use client';

import { use } from 'react';
import { AdvancedDocumentViewer } from '@/components/advanced-document-viewer';

export default function ArchiveDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { id } = resolvedParams;

  return <AdvancedDocumentViewer id={id} />;
}
