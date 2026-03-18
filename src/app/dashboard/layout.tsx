// import { AlertComponent } from '@/shared/components/common/AlertComponent'
import NavBar from '@/shared/components/layout/NavBar';
import SideBarContainer from '@/shared/components/layout/SideBarContainer';
import { DashboardBreadcrumbs } from '@/shared/components/layout/DashboardBreadcrumbs';
import '../globals.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`grid grid-rows-[auto,1fr] grid-cols-[auto,1fr] h-screen `}>
      <div className="row-span-2 ">
        <SideBarContainer />
      </div>
      <div className="border-r border-b border-muted/50">
        <NavBar />
      </div>
      <div className="overflow-y-auto">
        <div className="px-6 py-2">
          <DashboardBreadcrumbs />
        </div>
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
