'use client';
import { useEditButton } from '@/shared/store/editState';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';

function BackButton() {
  const router = useRouter();
  const desabilitarEdicion = useEditButton((state: any) => state.setReadOnly);

  const handleBack = () => {
    desabilitarEdicion();
    router.back();
  };

  return (
    <Button variant={'outline'} onClick={() => handleBack()}>
      Volver
    </Button>
  );
}

export default BackButton;
