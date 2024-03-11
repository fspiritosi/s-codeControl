'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Dispatch, SetStateAction, useState } from 'react'
import MultiResourceDocument from './MultiResourceDocument'
import SimpleDocument from './SimpleDocument'
import { Button } from './ui/button'

export default function NewDocumentModal({
  setIsOpen,
  isOpen,
  multiresource,
}: {
  setIsOpen: Dispatch<SetStateAction<boolean>>
  isOpen: boolean
  multiresource: boolean | undefined
}) {
  const [resource, setResource] = useState<string | undefined>(undefined)
  const [multiresourceOpen, setMultiresourceOpen] = useState<boolean>(false)
  const handleOpen = (boolean: boolean, resource: string) => {
    setResource(resource)

    if (!multiresource) {
      setOpen(true)
    } else {
      setMultiresourceOpen(true)
    }

    setIsOpen(false)
  }

  const [open, setOpen] = useState(false)

  const handleSimpleModalOpen = () => {
    setOpen(!open)
  }
  const handleMultiResourceModalOpen = () => {
    setMultiresourceOpen(!multiresourceOpen)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {`El nuevo documento estara vinculado a los empleados o equipos?`}
            </DialogTitle>
            <DialogDescription>
              {`Selecciiona si el documento que vas a crear estara vinculado a los empleados o a los equipos.`}
            </DialogDescription>
            <div className="flex justify-evenly w-full pt-3">
              <Button
                onClick={() => handleOpen(true, 'empleado')}
                type="submit"
              >
                Empleados
              </Button>
              <Button onClick={() => handleOpen(false, 'equipo')} type="submit">
                Equipos
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <SimpleDocument
        resource={resource}
        open={open}
        handleSimpleModalOpen={handleSimpleModalOpen}
      />
      <MultiResourceDocument
        resource={resource}
        multiresourceOpen={multiresourceOpen}
        handleMultiResourceModalOpen={handleMultiResourceModalOpen}
      />
    </>
  )
}
