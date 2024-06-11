'use client'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

function BackButton() {
  const router = useRouter()
  return <Button onClick={() => router.back()}>Volver</Button>
}

export default BackButton
