'use client';
import NewDocumentModal from '@/components/NewDocumentModal';
import { Button } from '@/components/ui/button';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useState } from 'react';
export default function DocumentNav() {
  const role = useLoggedUserStore((state) => state.roleActualCompany);
  const [multiresource, setMultiresource] = useState<boolean | undefined>(undefined);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleMultiResource = (boolean: boolean) => {
    setMultiresource(boolean);
    setIsOpen(true);
  };
  return (
    <>
      {role !== 'Invitado' && <Button onClick={() => handleMultiResource(true)}>Documento multirecurso</Button>}
      {role !== 'Invitado' && <Button onClick={() => handleMultiResource(false)}>Documento no multirecurso</Button>}
      <NewDocumentModal setIsOpen={setIsOpen} isOpen={isOpen} multiresource={multiresource} />
    </>
  );
}
