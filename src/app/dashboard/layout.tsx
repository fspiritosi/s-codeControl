// import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar';
import SideBarContainer from '@/components/SideBarContainer';
import { Inter } from 'next/font/google';
import '../globals.css';
const font = Inter({ subsets: ['latin'] });

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`grid grid-rows-[auto,1fr] grid-cols-[auto,1fr] h-screen `}>
      <div className="row-span-2 ">
        <SideBarContainer />
      </div>
      <div className="border-r border-b border-muted/50">
        <NavBar />
      </div>
      <div >{children}</div>
    </div>
  );
}
