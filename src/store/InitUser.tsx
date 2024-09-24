'use client';
import { Company, SharedCompanies } from '@/zodSchemas/schemas';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useLoggedUserStore } from './loggedUser';

export default function InitState({
  user,
  companies,
  share_company_users,
  credentialUser,
  role,
}: {
  user: User | null;
  companies: any;
  share_company_users: any;
  credentialUser: any;
  role: string;
}) {
  const initState = useRef(false);
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [role]);
  //   const profileUser = useLoggedUserStore(state => state.profileUser)
  let selectedCompany: Company;
  useEffect(() => {
    if (!initState.current) {
      //Setear los siguientes estados
      //1 credentialUser
      useLoggedUserStore.setState({ credentialUser: user });
      //profile
      useLoggedUserStore.setState({ profile: credentialUser || [] });
      useLoggedUserStore.setState({ codeControlRole: credentialUser?.[0].role });
      //companies
      useLoggedUserStore.setState({ sharedCompanies: share_company_users as SharedCompanies });
      const role = share_company_users?.find((e: any) => e.profile_id === user?.id);
      console.log('role', role);
      if (role?.role) {
        useLoggedUserStore.setState({ roleActualCompany: user?.role });
        // await documetsFetch();
        useLoggedUserStore.getState().documetsFetch();
      } else {
        useLoggedUserStore.setState({ roleActualCompany: undefined });
      }
      useLoggedUserStore.setState({ allCompanies: companies });

      const savedCompany = localStorage.getItem('company_id') || ''; //! una empresa te comparte

      if (savedCompany) {
        const company = share_company_users?.find(
          (company: any) => company.company_id.id === JSON.parse(savedCompany)
        )?.company_id;

        console.log('savedCompany', company);

        if (company) {
          console.log('setSavedCompany', company);
          useLoggedUserStore.getState().setActualCompany(company);
          return;
        }
      }

      selectedCompany = useLoggedUserStore.getState()?.allCompanies.filter((company) => company.by_defect);
      console.log('selectedCompany', selectedCompany);
      if (companies.length > 1) {
        if (selectedCompany) {
          console.log('setSavedCompany', companies);
          useLoggedUserStore.getState()?.setActualCompany(selectedCompany[0]);
        }
      }
      if (companies.length === 1) {
        console.log('setSavedCompany', companies);
        useLoggedUserStore.getState()?.setActualCompany(companies[0]);
      }
      if (companies.length === 0 && share_company_users?.length! > 0) {
        console.log('setSavedCompany', companies);
        useLoggedUserStore.getState()?.setActualCompany(share_company_users?.[0]?.company_id);
      }
    }

    console.log('final del estado', useLoggedUserStore.getState());

    initState.current = true;
  }, []);
  return <></>;
}
