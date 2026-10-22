'use server';
import { prisma } from '@/shared/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export interface CompanyUserByCuil {
  company_id: string;
  confirmed_at: string;
  email: string;
  employee_created_at: string;
  employee_cuil: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  last_sign_in_at: string;
  phone: string;
  raw_user_meta_data: Record<string, unknown>;
  user_created_at: string;
  user_cuil: string;
  user_id: string;
  user_updated_at: string;
}

type PortalRow = Omit<
  CompanyUserByCuil,
  'confirmed_at' | 'last_sign_in_at' | 'user_created_at' | 'user_updated_at' | 'employee_created_at'
> & {
  confirmed_at: Date | null;
  last_sign_in_at: Date | null;
  user_created_at: Date | null;
  user_updated_at: Date | null;
  employee_created_at: Date | null;
};

const iso = (value: Date | null) => (value ? value.toISOString() : '');

/** Usuarios del portal cuyo CUIL coincide con el de un empleado de la empresa actual. */
export const getPendingRequests = async (): Promise<CompanyUserByCuil[]> => {
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  try {
    const rows = await prisma.$queryRaw<PortalRow[]>`
      SELECT
        p.id AS user_id,
        p.email,
        p.phone,
        p.email_verified_at AS confirmed_at,
        p.last_sign_in_at,
        p.created_at AS user_created_at,
        p.created_at AS user_updated_at,
        p.cuil AS user_cuil,
        e.id AS employee_id,
        e.cuil AS employee_cuil,
        e.company_id,
        e.firstname AS first_name,
        e.lastname AS last_name,
        e.created_at AS employee_created_at,
        p.metadata AS raw_user_meta_data
      FROM public.profile p
      JOIN public.employees e ON REPLACE(p.cuil, '-', '') = REPLACE(e.cuil, '-', '')
      WHERE p.cuil IS NOT NULL
        AND e.company_id = ${company_id}::uuid
    `;
    return rows.map((row) => ({
      ...row,
      confirmed_at: iso(row.confirmed_at),
      last_sign_in_at: iso(row.last_sign_in_at),
      user_created_at: iso(row.user_created_at),
      user_updated_at: iso(row.user_updated_at),
      employee_created_at: iso(row.employee_created_at),
    }));
  } catch (error) {
    console.error('Error fetching company users:', error);
    return [];
  }
};

async function setPortalVerified(userId: string, verified: boolean) {
  const session = await auth();
  if (!session?.user?.profileId) throw new Error('No autorizado');

  await prisma.$executeRaw`
    UPDATE public.profile
    SET metadata = metadata || ${JSON.stringify({ verified })}::jsonb
    WHERE id = ${userId}::uuid
  `;
  return { user: { id: userId } };
}

export const approveUserRequest = async (userId: string) => setPortalVerified(userId, true);

export const removeUserAccess = async (userId: string) => setPortalVerified(userId, false);
