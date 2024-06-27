'use client';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useLoggedUserStore } from './loggedUser';

export default function InitCompanies({
  company,
  share_company_users,
}: {
  company: any[] | null;
  share_company_users: any[] | null;
}) {
  const documentsFetch = useLoggedUserStore((state) => state.documetsFetch);
  const supabase = supabaseBrowser();

  return <></>;
}
