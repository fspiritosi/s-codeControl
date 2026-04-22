'use client';
import { Company, SharedCompanies } from '@/shared/zodSchemas/schemas';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuthStore } from './authStore';
import { useCompanyStore } from './companyStore';
import Cookies from 'js-cookie';

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
  const prevRole = useRef<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (prevRole.current !== undefined && prevRole.current !== role) {
      router.refresh();
    }
    prevRole.current = role;
  }, [role]);

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
      } else {
        useAuthStore.setState({ roleActualCompany: undefined as any });
      }
      useCompanyStore.setState({ allCompanies: companies });

      // 3. Determine which company to activate
      // Priority: cookie > localStorage > by_defect > first owned > first shared
      const cookieCompanyId = Cookies.get('actualComp');

      // Check if cookie points to a valid company
      if (cookieCompanyId) {
        const ownedMatch = companies?.find((c: any) => c.id === cookieCompanyId);
        const sharedMatch = share_company_users?.find(
          (sc: any) => sc.company_id === cookieCompanyId || sc.company?.id === cookieCompanyId
        );
        if (ownedMatch) {
          useCompanyStore.getState().setActualCompany(ownedMatch);
          initState.current = true;
          return;
        }
        if (sharedMatch) {
          const company = sharedMatch.company ?? sharedMatch.company_id;
          useCompanyStore.getState().setActualCompany(company);
          initState.current = true;
          return;
        }
      }

      // Check localStorage (for shared company selections)
      const savedCompany = localStorage.getItem('company_id') || '';
      if (savedCompany) {
        const company = share_company_users?.find(
          (sc: any) => sc.company_id?.id === JSON.parse(savedCompany)
        )?.company_id;
        if (company) {
          useCompanyStore.getState().setActualCompany(company);
          initState.current = true;
          return;
        }
      }

      // Fall back to by_defect company, then first owned, then first shared
      const defaultCompany = companies?.filter((c: any) => c.by_defect)?.[0];
      if (defaultCompany) {
        useCompanyStore.getState().setActualCompany(defaultCompany);
      } else if (companies?.length > 0) {
        useCompanyStore.getState().setActualCompany(companies[0]);
      } else if (share_company_users?.length > 0) {
        const company = share_company_users[0].company ?? share_company_users[0].company_id;
        useCompanyStore.getState().setActualCompany(company);
      }
    }

    initState.current = true;
  }, []);
  return <></>;
}
