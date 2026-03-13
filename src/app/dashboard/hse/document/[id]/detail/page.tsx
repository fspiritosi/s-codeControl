'use client';
import DocumentDetail from '@/modules/hse/features/documents/components/DocumentDetail';
import { use } from 'react';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DocumentDetail id={id} />;
}
