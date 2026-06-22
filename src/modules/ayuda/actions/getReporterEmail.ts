'use server';

import { auth } from '@/auth';
import { supabaseServer } from '@/shared/lib/supabase/server';
import type { ReporterIdentity } from '../types';

/**
 * Identidad del usuario que reporta tickets. Espeja a `fetchCurrentUser`
 * (src/shared/actions/auth.ts): el proyecto usa NextAuth como auth principal
 * y Supabase Auth solo como fallback para sesiones legacy.
 *
 * `userId` se usa como FK (uuid) en `support_ticket_views.user_id`:
 * - NextAuth → `session.user.profileId` (id del profile, uuid).
 * - Supabase → `user.id` (uuid).
 */
export async function getReporterEmail(): Promise<ReporterIdentity | null> {
  // 1) NextAuth (auth principal)
  const session = await auth();
  if (session?.user?.profileId && session.user.email) {
    return {
      email: session.user.email,
      name: session.user.name || null,
      userId: session.user.profileId,
    };
  }

  // 2) Fallback a Supabase Auth (sesiones legacy)
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const firstname = typeof meta.firstname === 'string' ? meta.firstname : null;
  const lastname = typeof meta.lastname === 'string' ? meta.lastname : null;
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : null;

  let name: string | null = null;
  if (firstname && lastname) name = `${firstname} ${lastname}`;
  else if (fullName) name = fullName;
  else if (firstname) name = firstname;

  return { email: user.email, name, userId: user.id };
}
