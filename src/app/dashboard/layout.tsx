// import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar'
import SideBar from '@/components/Sidebar'
import { supabaseServer } from '@/lib/supabase/server'
import InitCompanies from '@/store/InitCompanies'
import InitEmployees from '@/store/InitEmployees'
import InitProfile from '@/store/InitProfile'
import InitUser from '@/store/InitUser'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = supabaseServer()
  const { data } = await supabase.auth.getSession()

  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', data?.session?.user?.id)

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
            contractors(
              *
            )
          )
        )
      )
    `,
    )
    .eq('owner_id', profile?.[0]?.id)

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
            contractors(
              *
            )
          )
        )
      )
    )`,
    )
    .eq('profile_id', profile?.[0]?.id)

  return (
    <div className="flex">
      <InitUser user={data.session?.user} />
      <InitProfile profile={profile || []} />
      <InitCompanies
        company={company}
        share_company_users={share_company_users}
      />
      <InitEmployees active={true} />
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <NavBar />
        <div>{children}</div>
      </div>
    </div>
  )
}
