'use client';

import { logout } from '@/modules/landing/features/auth/actions/login.actions';
import { updateProfileAvatar as updateProfileAvatarAction } from '@/shared/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form';
import { Separator } from '@/shared/components/ui/separator';
import { AlertDialogHeader } from '@/shared/components/ui/alert-dialog';
import { UpdateUserPasswordForm } from '@/shared/components/auth/UpdateUserPasswordForm';
import { UploadImage } from '@/shared/components/common/UploadImage';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { LogOut, Settings, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

export function NavUser() {
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const actualUser = useLoggedUserStore((state) => state.profile);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { control, setValue } = useForm();

  const user = actualUser?.[0];
  const fullname = user?.fullname || '';
  const email = user?.email || '';
  const avatar = user?.avatar || '';
  const initials = fullname
    ? fullname
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w.charAt(0).toUpperCase())
        .join('')
    : 'U';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const updateProfileAvatar = async (imageUrl: string) => {
    try {
      const { error } = await updateProfileAvatarAction(user?.id || '', imageUrl);
      if (error) throw new Error(error);
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer outline-none" asChild aria-label="Menú de usuario">
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={avatar} alt={fullname} />
              <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px]">{initials}</span>
            <ChevronsUpDown className="hidden sm:inline size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-lg">
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={avatar} alt={fullname} />
                <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{fullname}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Settings className="mr-2 size-4" />
            Editar perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 size-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Aqui se haran cambios en tu perfil</DialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="w-[300px] flex gap-2">
              <FormProvider {...useForm()}>
                <FormField
                  control={control}
                  name="company_logo"
                  render={() => (
                    <FormItem className="max-w-[600px] flex flex-col justify-center">
                      <FormControl>
                        <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                          <UploadImage
                            companyId={actualCompany?.id as string}
                            labelInput="Avatar"
                            imageBucket="avatar"
                            desciption="Sube tu avatar"
                            style={{ width: '300px' }}
                            onImageChange={async (imageUrl) => {
                              setValue('profile', imageUrl);
                              await updateProfileAvatar(imageUrl);
                            }}
                            inputStyle={{ width: '150px' }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormProvider>
            </div>
            <Separator className="my-4" />
            <UpdateUserPasswordForm />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
