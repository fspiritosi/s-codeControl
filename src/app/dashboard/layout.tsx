// import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar';
import SideBar from '@/components/Sidebar';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`grid grid-rows-[auto,1fr] grid-cols-[auto,1fr] h-screen bg-muted/40`}>
      <div className="row-span-2 bg-muted/40">
        <SideBar />
      </div>
      <div className="bg-muted/40 border-r border-b border-muted/50">
        <NavBar />
      </div>
      <div className="overflow-y-auto bg-muted/40">{children}</div>
    </div>
  );
}
