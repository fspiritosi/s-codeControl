import { getSession } from '@/shared/lib/session';

export const getRole = async () => {
  const session = await getSession();
  return session.role || null;
};
