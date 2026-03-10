'use client';
import { Button } from './ui/button';
import { logout } from '@/app/login/actions';

export const LogOutButton = () => {
  return (
    <Button onClick={() => logout()} className="text-white bg-blue-300 hover:bg-blue-600">
      Cerrar Sesion
    </Button>
  );
};
