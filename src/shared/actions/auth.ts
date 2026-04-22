'use server';
import { prisma } from '@/shared/lib/prisma';
import { auth } from '@/auth';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { getActionContext } from '@/shared/lib/server-action-context';

// --- From company/queries.ts ---

export const fetchCurrentUser = async () => {
  // Try NextAuth first
  const session = await auth();
  if (session?.user?.profileId) {
    return {
      id: session.user.profileId,
      email: session.user.email,
    };
  }

  // Fallback to Supabase auth for legacy sessions
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

export const getCurrentProfile = async () => {
  const user = await fetchCurrentUser();

  if (!user) return [];

  try {
    const data = await prisma.profile.findMany({
      where: { id: user?.id || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching current profile:', error);
    return [];
  }
};

export const verifyUserRoleInCompany = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return '';

  const user = await fetchCurrentUser();

  try {
    const data = await prisma.share_company_users.findMany({
      where: { profile_id: user?.id || '', company_id: companyId },
    });

    return { rol: data[0]?.role || '', modulos: data[0]?.modules || [] };
  } catch (error) {
    console.error('Error verifying user role:', error);
    return '';
  }
};

export const fetchProfileByCredentialId = async (credentialId: string) => {
  if (!credentialId) return [];
  try {
    const data = await prisma.profile.findMany({
      where: { credential_id: credentialId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching profile:', error);
    return [];
  }
};

// --- From company/mutations.ts ---

export const fetchProfileByEmail = async (email: string) => {
  try {
    const data = await prisma.profile.findMany({
      where: { email },
    });
    return data;
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    return [];
  }
};

export const fetchProfileByEmailServer = async (email: string) => {
  try {
    const data = await prisma.profile.findMany({ where: { email } });
    return data;
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    return [];
  }
};

export const insertProfile = async (profileData: Record<string, unknown>) => {
  try {
    const data = await prisma.profile.create({ data: profileData as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error inserting profile:', error);
    return { data: null, error: String(error) };
  }
};

export const insertProfileServer = async (profileData: Record<string, unknown>) => {
  try {
    const data = await prisma.profile.create({ data: profileData as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error inserting profile:', error);
    return { data: null, error: String(error) };
  }
};

export const updateProfileAvatar = async (profileId: string, avatarUrl: string) => {
  try {
    const data = await prisma.profile.update({
      where: { id: profileId },
      data: { avatar: avatarUrl },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile avatar:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchRoles = async () => {
  try {
    const data = await prisma.roles.findMany({
      where: { intern: false, NOT: { name: 'Invitado' } },
    });
    return data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

// --- From shared/queries.ts ---

export const fetchProfileById = async (userId: string) => {
  if (!userId) return null;
  try {
    const data = await prisma.profile.findUnique({
      where: { id: userId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

export const fetchProfileBySupabaseUserId = async (userId: string) => {
  try {
    const data = await prisma.profile.findMany({
      where: { id: userId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching profile by user id:', error);
    return [];
  }
};
