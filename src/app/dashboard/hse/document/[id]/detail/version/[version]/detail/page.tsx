'use client';
import DocumentVersionDetail from '@/modules/hse/features/documents/components/DocumentVersionDetail';
import { use } from 'react';

export default function DocumentVersionDetailPage({ params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version } = use(params);
  return <DocumentVersionDetail id={id} version={version} />;
}
