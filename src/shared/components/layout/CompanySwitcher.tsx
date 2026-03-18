'use client';

import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Check, ChevronsUpDown, Plus, Loader } from 'lucide-react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import type { Company } from '@/shared/zodSchemas/schemas';

export function CompanySwitcher({ collapsed }: { collapsed: boolean }) {
  const allCompanies = useLoggedUserStore((state) => state.allCompanies);
  const sharedCompanies = useLoggedUserStore((state) => state.sharedCompanies);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const setActualCompany = useLoggedUserStore((state) => state.setActualCompany);
  const setNewDefectCompany = useLoggedUserStore((state) => state.setNewDefectCompany);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build companies list from owned + shared
  const sharedCompanyObjects = (sharedCompanies ?? []).map(
    (sc: any) => sc.company ?? sc.company_id
  ).filter(Boolean);

  const ownedIds = new Set((allCompanies ?? []).map((c: any) => c.id));
  const uniqueShared = sharedCompanyObjects.filter((c: any) => !ownedIds.has(c.id));
  const companies = [...(allCompanies ?? []), ...uniqueShared];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = async (company: any) => {
    Cookies.set('actualComp', company.id, { path: '/' });
    setNewDefectCompany(company as Company[0]);
    setActualCompany(company as Company[0]);
    setOpen(false);
    // Small delay to ensure cookie is set before navigation
    await new Promise((r) => setTimeout(r, 100));
    location.replace('/dashboard');
  };

  if (!actualCompany) {
    return (
      <div className="flex items-center justify-center p-3">
        <Loader className="animate-spin size-5" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-2">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center w-full gap-2 rounded-md border p-2 hover:bg-muted/80 transition-colors',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="size-7 shrink-0 rounded-md">
            <AvatarImage
              src={actualCompany.company_logo ?? undefined}
              alt={actualCompany.company_name}
              className="object-contain"
            />
            <AvatarFallback className="uppercase text-xs rounded-md">
              {actualCompany.company_name.charAt(0)}
              {actualCompany.company_name.charAt(1)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="truncate text-sm font-medium">{actualCompany.company_name}</span>
          )}
        </div>
        {!collapsed && <ChevronsUpDown className="size-4 shrink-0 opacity-50" />}
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-md border bg-popover shadow-md">
          <div className="max-h-[240px] overflow-y-auto p-1">
            {companies.map((company: any) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company)}
                className={cn(
                  'flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors',
                  actualCompany.id === company.id && 'bg-accent'
                )}
              >
                <Avatar className="size-5 shrink-0 rounded-md">
                  <AvatarImage
                    src={company.company_logo ?? undefined}
                    alt={company.company_name}
                    className="object-contain"
                  />
                  <AvatarFallback className="uppercase text-[10px] rounded-md">
                    {company.company_name?.charAt(0)}
                    {company.company_name?.charAt(1)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{company.company_name}</span>
                {actualCompany.id === company.id && (
                  <Check className="ml-auto size-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t p-1">
            <Link
              href="/dashboard/company/new"
              className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              <Plus className="size-4" />
              Agregar compañía
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
