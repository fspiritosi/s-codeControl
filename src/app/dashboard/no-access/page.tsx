import { NoAccessView } from '@/shared/components/common/NoAccessView';

export const dynamic = 'force-dynamic';

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; permission?: string }>;
}) {
  const { module, permission } = await searchParams;
  return <NoAccessView module={module} permission={permission} />;
}
