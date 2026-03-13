'use client';
import { Company, SharedCompanies } from '@/shared/zodSchemas/schemas';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuthStore } from './authStore';
import { useCompanyStore } from './companyStore';
import { useDocumentStore } from './documentStore';

type AuthUser = { id: string; email?: string; role?: string; [key: string]: any } | null;

export default function InitState({
  user,
  companies,
  share_company_users,
  credentialUser,
  role,
}: {
  user: AuthUser;
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

  let selectedCompany: Company;
  useEffect(() => {
    if (!initState.current) {
      // 1. Auth store
      useAuthStore.setState({ credentialUser: user });
      useAuthStore.setState({ profile: credentialUser || [] });
      useAuthStore.setState({ codeControlRole: credentialUser?.[0].role });

      // 2. Company store
      useCompanyStore.setState({ sharedCompanies: share_company_users as SharedCompanies });
      const userRole = share_company_users?.find((e: any) => e.profile_id === user?.id);
      if (userRole?.role) {
        useAuthStore.setState({ roleActualCompany: user?.role as any });
        useDocumentStore.getState().documetsFetch();
      } else {
        useAuthStore.setState({ roleActualCompany: undefined as any });
      }
      useCompanyStore.setState({ allCompanies: companies });

      const savedCompany = localStorage.getItem('company_id') || '';

      if (savedCompany) {
        const company = share_company_users?.find(
          (company: any) => company.company_id.id === JSON.parse(savedCompany)
        )?.company_id;

        if (company) {
          useCompanyStore.getState().setActualCompany(company);
          return;
        }
      }

      const defaultCompany = useCompanyStore.getState()?.allCompanies?.filter((company) => company.by_defect) ?? [];

      selectedCompany = defaultCompany.length ? defaultCompany : (useCompanyStore.getState()?.allCompanies ?? []);

      if (companies?.length > 1) {
        if (selectedCompany) {
          useCompanyStore.getState()?.setActualCompany(selectedCompany[0]);
        }
      }

      if (companies?.length === 1) {
        useCompanyStore.getState()?.setActualCompany(companies[0]);
      }

      if ((!companies || companies.length === 0) && share_company_users?.length! > 0) {
        useCompanyStore.getState()?.setActualCompany(share_company_users?.[0]?.company_id);
      }
    }

    initState.current = true;
  }, []);
  return <></>;
}
