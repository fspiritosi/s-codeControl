'use client'
import NewDocumentModal from '@/components/NewDocumentModal'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function page() {
  const [multiresource, setMultiresource] = useState<boolean | undefined>(
    undefined,
  )
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleMultiResource = (boolean: boolean) => {
    setMultiresource(boolean)
    setIsOpen(true)
  }
  return (
    <section>
      <div className="flex justify-between flex-wrap">
        <h2>Aqui estaran todos los documentos de la empresa</h2>
        <div className="flex gap-3 flex-wrap">
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
        </div>
      </div>
    </section>
  )
}
