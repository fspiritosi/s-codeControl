import { Suspense } from 'react';
import SettingsView from '@/modules/settings/features/parameters/components/SettingsView';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const resolved = await searchParams;

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <SettingsView currentSection={resolved.section} />
    </Suspense>
  );
}
