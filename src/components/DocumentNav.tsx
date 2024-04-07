'use client'
import NewDocumentModal from '@/components/NewDocumentModal'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function DocumentNav() {
  const [multiresource, setMultiresource] = useState<boolean | undefined>(
    undefined,
  )
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleMultiResource = (boolean: boolean) => {
    setMultiresource(boolean)
    setIsOpen(true)
  }
  console.log('Esto viene del document vav')
  return (
    <>
      <Button onClick={() => handleMultiResource(true)}>
        Documento multirecurso
      </Button>
      <Button onClick={() => handleMultiResource(false)}>
        Documento no multirecurso
      </Button>
      <NewDocumentModal
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        multiresource={multiresource}
      />
    </>
  )
}
