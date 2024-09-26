'use client';
import NewDocumentModal from '@/components/NewDocumentModal';
import { Button } from '@/components/ui/button';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useState } from 'react';
export default function DocumentNav({
  empleados,
  onlyNoMultiresource,
  equipment,
  mandatoryLabel,
  documentNumber,
}: {
  empleados?: boolean;
  equipment?: boolean;
  onlyNoMultiresource?: boolean;
  mandatoryLabel?: string;
  documentNumber?: string;
}) {
  const role = useLoggedUserStore((state) => state.roleActualCompany);
  const [multiresource, setMultiresource] = useState<boolean | undefined>(undefined);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleMultiResource = (boolean: boolean) => {
    setMultiresource(boolean);
    setIsOpen(true);
  };

  console.log('documentNumber', documentNumber);

  return (
    <>
      {role !== 'Invitado' && !onlyNoMultiresource && (
        <Button type="button" onClick={() => handleMultiResource(true)}>
          Documento multirecurso
        </Button>
      )}
      {role !== 'Invitado' && (
        <Button type="button" onClick={() => handleMultiResource(false)}>
          {mandatoryLabel || ' Documento no multirecurso'}
        </Button>
      )}
      <NewDocumentModal
        empleados={empleados}
        equipment={equipment}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        multiresource={multiresource}
        documentNumber={documentNumber}
      />
    </>
  );
}
