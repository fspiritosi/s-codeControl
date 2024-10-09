// import { AlertComponent } from '@/components/AlertComponent'
import { supabaseServer } from '@/lib/supabase/server';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import '../globals.css';
import AdminNavbar from './components/adminNavbar';
import AdminSideBar from './components/adminSidebar';

const inter = Inter({ subsets: ['latin'] });

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookiesStore = cookies();

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

  //   let { data: document, error } = await supabase
  //     .from('documents_employees')
  //     .select(
  //       `
  //   *,
  //   employees:employees(*,contractor_employee(
  //     contractors(
  //       *
  //     )
  //   )),
  //   document_types:document_types(*)
  // `,
  //     )
  //     .not('employees', 'is', null)
  //     .eq('employees.company_id', actualCompany?.value.replace(/^"|"$/g, ''))

  //   let { data: equipmentData, error: equipmentError } = await supabase
  //     .from('documents_equipment')
  //     .select(
  //       `
  //     *,
  //     document_types:document_types(*),
  //     applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
  //     `,
  //     )
  //     .eq('applies.company_id', actualCompany?.value.replace(/^"|"$/g, ''))
  //     .not('applies', 'is', null)

  //   revalidatePath('/dashboard/document')

  return (
    <div>
      {/* <InitCompanies
          company={company}
          share_company_users={share_company_users}
        /> */}
      <AdminSideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <AdminNavbar />
        <div>{children}</div>
      </div>
    </div>
  );
}

// className="flex"
