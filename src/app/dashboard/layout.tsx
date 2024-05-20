// import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar'
import SideBar from '@/components/Sidebar'
import { supabaseServer } from '@/lib/supabase/server'
import InitCompanies from '@/store/InitCompanies'
import InitDocuments from '@/store/InitDocuments'
import InitEmployees from '@/store/InitEmployees'
import InitProfile from '@/store/InitProfile'
import InitUser from '@/store/InitUser'
import { revalidatePath } from 'next/cache'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookiesStore = cookies()

  const actualCompany = cookiesStore.get('actualComp')

  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', user?.id)

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

  let { data: document, error } = await supabase
    .from('documents_employees')
    .select(
      `
  *,
  employees:employees(*,contractor_employee(
    contractors(
      *
    )
  )),
  document_types:document_types(*)
`,
    )
    .not('employees', 'is', null)
    .eq('employees.company_id', actualCompany?.value.replace(/^"|"$/g, ''))

  let { data: equipmentData, error: equipmentError } = await supabase
    .from('documents_equipment')
    .select(
      `
    *,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
    `,
    )
    .eq('applies.company_id', actualCompany?.value.replace(/^"|"$/g, ''))
    .not('applies', 'is', null)

  revalidatePath('/dashboard', 'layout')

  return (
    <div className="flex">
      <InitUser user={user} />
      <InitProfile profile={profile || []} />
      <InitCompanies
        company={company}
        share_company_users={share_company_users}
      />
      <InitEmployees active={true} />
      <InitDocuments data={document} equipmentData={equipmentData} />
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <NavBar />
        <div>{children}</div>
      </div>
    </div>
  )
}
