'use client';
import { profileUser } from '@/types/types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLoggedUserStore } from './loggedUser';

export default function InitProfile({ profile }: { profile: profileUser[] | undefined | any[] }) {
  const initState = useRef(false);
  const router = useRouter();
  const useSearch = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  useEffect(() => {
    if (initState.current) {
      const denied = useSearch?.get('access_denied');
      if (denied) {
        toast.warning('Acceso denegado');

        useSearch?.delete('access_denied');
        router.push('/dashboard'); // Convert router.pathname to string
      }
      if (!initState.current) {
        useLoggedUserStore.setState({ profile: profile });
      }
    }
    initState.current = true;
  }, []);

  return <></>;
}
