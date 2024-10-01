'use client';
import { useEditButton } from '@/store/editState';
import { useEffect } from 'react';
import { Button } from './ui/button';

function EditButton() {
  const readOnly = useEditButton((state) => state.readonly);

  const habilitarEdicion = useEditButton((state: any) => state.setReadOnly);

  useEffect(() => {
    habilitarEdicion();
  }, []);
  return readOnly ? (
    <Button variant="default" onClick={habilitarEdicion}>
      {' '}
      Habilitar edición{' '}
    </Button>
  ) : (
    <Button variant="default" onClick={() => habilitarEdicion()}>
      {' '}
      Deshabilitar edición{' '}
    </Button>
  );
}

export default EditButton;
