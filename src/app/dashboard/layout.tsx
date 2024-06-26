// import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar';
import SideBar from '@/components/Sidebar';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex">
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0 bg-muted/40">
        <NavBar />
        <div>{children}</div>
      </div>
    </div>
  );
}
