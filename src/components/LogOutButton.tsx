'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/supabase';
import { Button } from './ui/button';

export const LogOutButton = () => {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  return (
    <Button onClick={handleLogout} className="text-white bg-blue-300 hover:bg-blue-600">
      Cerrar Sesión
    </Button>
  );
};
