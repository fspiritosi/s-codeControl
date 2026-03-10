import { prisma } from '@/lib/prisma';
import { supabaseServer } from '@/lib/supabase/server';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import '../globals.css';
import AdminNavbar from './components/adminNavbar';
import AdminSideBar from './components/adminSidebar';

const inter = Inter({ subsets: ['latin'] });

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookiesStore = await cookies();

  const actualCompany = cookiesStore.get('actualComp');

  const profile = await prisma.profile.findMany({
    where: { credential_id: user?.id || '' },
  });

  // Note: company and share_company_users data is fetched but not used in the layout template
  // Keeping the queries for potential child component usage via props
  const company = await prisma.company.findMany({
    where: { owner_id: profile?.[0]?.id || '' },
  });

  const share_company_users = await prisma.share_company_users.findMany({
    where: { profile_id: profile?.[0]?.id || '' },
  });

  return (
    <div>
      <AdminSideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <AdminNavbar />
        <div>{children}</div>
      </div>
    </div>
  );
}
