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

  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', user?.id || '');

  const { data: company, error: companyError } = await supabase
    .from('company')
    .select(
      `
        *,
        owner_id(*),
        share_company_users(*,
          profile(*)
        ),
        city (
          name,
          id
        ),
        province_id (
          name,
          id
        ),
        companies_employees (
          employees(
            *,
            city (
              name
            ),
            province(
              name
            ),
            workflow_diagram(
              name
            ),
            hierarchical_position(
              name
            ),
            birthplace(
              name
            ),
            contractor_employee(
              customers(
                *
              )
            )
          )
        )
      `
    )
    .eq('owner_id', profile?.[0]?.id || '');

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(
      `*,company_id(*,
          owner_id(*),
        share_company_users(*,
          profile(*)
        ),
        city (
          name,
          id
        ),
        province_id (
          name,
          id
        ),
        companies_employees (
          employees(
            *,
            city (
              name
            ),
            province(
              name
            ),
            workflow_diagram(
              name
            ),
            hierarchical_position(
              name
            ),
            birthplace(
              name
            ),
            contractor_employee(
              customers(
                *
              )
            )
          )
        )
      )`
    )
    .eq('profile_id', profile?.[0]?.id || '');

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
