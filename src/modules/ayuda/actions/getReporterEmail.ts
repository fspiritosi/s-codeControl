'use server';

import { auth } from '@/auth';
import type { ReporterIdentity } from '../types';

/**
 * Identidad del usuario que reporta tickets. Espeja a `fetchCurrentUser`
 * (src/shared/actions/auth.ts).
 *
 * `userId` se usa como FK (uuid) en `support_ticket_views.user_id` y es
 * `session.user.profileId` (id del profile, uuid).
 */
export async function getReporterEmail(): Promise<ReporterIdentity | null> {
  const session = await auth();
  if (session?.user?.profileId && session.user.email) {
    return {
      email: session.user.email,
      name: session.user.name || null,
      userId: session.user.profileId,
    };
  }

  return null;
}
