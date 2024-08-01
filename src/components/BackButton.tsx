'use client';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import {Undo2} from 'lucide-react'

function BackButton() {
  const router = useRouter();
  // return <Button onClick={() => router.back()}><Undo2/></Button>;
  return <Button onClick={() => router.back()}>Volver</Button>;
}

export default BackButton;
