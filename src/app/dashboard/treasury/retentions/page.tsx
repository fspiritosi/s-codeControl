import { redirect } from 'next/navigation';

export default async function RetentionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ tab: 'retentions' });
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') params.set(k, v);
  }
  redirect(`/dashboard/treasury?${params.toString()}`);
}
