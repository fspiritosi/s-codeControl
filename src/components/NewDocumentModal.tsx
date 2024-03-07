import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { useState } from 'react'
import MultiResourceDocument from './MultiResourceDocument'
import SimpleDocument from './SimpleDocument'
import { Button } from './ui/button'

export default function NewDocumentModal() {
  const [multiresource, setMultiresource] = useState<boolean | undefined>(
    undefined,
  )
  const [isOpen, setIsOpen] = useState<boolean>(false)

  let url = ''

  if (typeof window !== 'undefined') {
    url = window.location.href
  }
  const resource = url.includes('employee') ? 'empleado' : 'equipo'
  const handleOpen = (boolean: boolean) => {
    setMultiresource(boolean)
    setIsOpen(false)
  }

  const handleReset = () => {
    setMultiresource(undefined)
    setIsOpen(!isOpen)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleReset}>
        <DialogTrigger className="bg-blue-500 hover:bg-blue-800 text-primary-foreground shadow py-2 px-3 rounded-lg text-[14px]">
          Crear nuevo documento
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {` ¿El documento que deseas subir abarca múltiples
             ${resource}?`}
            </DialogTitle>
            <DialogDescription>
              {`El documento estara vinculado a mas de un ${resource}?`}
            </DialogDescription>
            <div className="flex justify-evenly w-full pt-3">
              <Button onClick={() => handleOpen(true)} type="submit">
                Si, es multirecurso
              </Button>
              <Button onClick={() => handleOpen(false)} type="submit">
                No, no es multirecurso
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {multiresource === true && <MultiResourceDocument resource={resource} />}
      {multiresource === false && <SimpleDocument resource={resource} />}
    </>
  )
}
