import NavBar from '@/shared/components/layout/NavBar';
import SideBarContainer from '@/shared/components/layout/SideBarContainer';
import { getSession } from '@/shared/lib/session';
import { getRouteRule } from '@/shared/lib/route-permissions';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../globals.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';

  const rule = getRouteRule(pathname);
  if (rule) {
    const session = await getSession();
    const granted = new Set(session.permissions);
    const isOwner = session.role === 'owner';
    if (!isOwner && !granted.has(rule.permission)) {
      redirect(
        `/dashboard/no-access?permission=${encodeURIComponent(rule.permission)}${
          rule.module ? `&module=${encodeURIComponent(rule.module)}` : ''
        }`
      );
    }
  }

  return (
    <div className={`grid grid-rows-[auto,1fr] grid-cols-[auto,1fr] h-screen `}>
      <div className="row-span-2 ">
        <SideBarContainer />
      </div>
      <div className="border-r border-b border-muted/50">
        <NavBar />
      </div>
      <div className="overflow-y-auto">
        <div className="animate-fade-in px-6  pb-6">{children}</div>
      </div>
    </div>
  );
}
