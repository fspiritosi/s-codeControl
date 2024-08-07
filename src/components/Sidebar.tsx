'use client';

import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { TbLayoutSidebarLeftExpand, TbLayoutSidebarRightExpand } from 'react-icons/tb';
import Logo1 from '../../public/logo-azul.png';
import LogoBlanco from '../../public/logoLetrasBlancas.png';
import LogoNegro from '../../public/logoLetrasNegras.png';
import SideLinks from './SideLinks';
import { useRouter } from 'next/navigation';

export default function SideBar() {
  const [expanded, setExpanded] = useState(true);
  const { theme } = useTheme();
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const documetsFetch = useLoggedUserStore((state) => state.documetsFetch);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const supabase = supabaseBrowser();
  const router = useRouter()

  supabase
    .channel('custom-all-channel1')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_employees' }, async (payload) => {
      let { data: employees, error } = await supabase
        .from('employees')
        .select('*,company_id(*)')
        .eq('id', (payload.new as { [key: string]: any }).applies);

      if (employees?.[0]?.company_id?.id === actualCompany?.id) {
        documetsFetch();
        router.refresh()
      } else {
        return;
      }
    })
    .subscribe();

  supabase
    .channel('custom-all-channel2')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_equipment' }, async (payload) => {
      let { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*,company_id(*)')
        .eq('id', (payload.new as { [key: string]: any }).applies);

      if (vehicle?.[0]?.company_id?.id !== actualCompany?.id) return;

      documetsFetch();
      router.refresh()
    })
    .subscribe();

  return (
    <div
      className={cn(
        'flex-col  px-3 py-0 md:px-2 bg-muted dark:bg-muted/50 border-r-2 h-screen w-[68px] sticky left-0 top-0 hidden md:flex',
        expanded ? 'w-[200px]' : 'w-[68px] '
      )}
    >
      <Link
        className={`flex h-20 items-center justify-center rounded-md  p-4${expanded ? '40' : '40'}`}
        href="/dashboard"
      >
        <div className={`flex items-center justify-center `}>
          {expanded ? (
            <Image
              placeholder="blur"
              priority={true}
              src={theme == 'dark' ? LogoBlanco : LogoNegro}
              alt="Logo code control"
              width={150}
            />
          ) : (
            <Image src={Logo1} alt="Logo code control" />
          )}
        </div>
      </Link>

      <div className="flex flex-col mt-2 space-y-2">
        <button
          className="px-3 py-1 dark:text-neutral-100 text-neutral-950  ml-auto rounded-md hover:text-blue-600 focus:outline-none justify-rigth"
          onClick={toggleSidebar}
        >
          {expanded ? <TbLayoutSidebarRightExpand size={20} /> : <TbLayoutSidebarLeftExpand size={20} />}
        </button>
        <SideLinks expanded={expanded} />
      </div>
    </div>
  );
}
