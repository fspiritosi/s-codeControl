'use client';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

function BackButton() {
  const router = useRouter();
  return <Button variant={'outline'} onClick={() => router.back()}>Volver</Button>;
}

export default BackButton;
