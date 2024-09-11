import { supabaseServer } from '@/lib/supabase/server';
import InitState from '@/store/InitUser';
import SideBar from './Sidebar';

async function SideBarContainer() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: credentialUser, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', user?.id);

  if (profileError) console.log(profileError);

  const { data: companies, error } = await supabase
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
    .eq('owner_id', user?.id);
  if (error) console.log(error);
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
    .eq('profile_id', user?.id);

  if (sharedError) console.log(sharedError);

  return (
    <>
      <InitState
        companies={companies}
        user={user}
        share_company_users={share_company_users}
        credentialUser={credentialUser}
      />
      <SideBar />
    </>
  );
}

export default SideBarContainer;
