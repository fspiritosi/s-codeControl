'use client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Dispatch, SetStateAction } from 'react'
import MultiResourceDocument from './MultiResourceDocument'
import SimpleDocument from './SimpleDocument'

export default function NewDocumentModal({
  setIsOpen,
  isOpen,
  multiresource,
}: {
  setIsOpen: Dispatch<SetStateAction<boolean>>
  isOpen: boolean
  multiresource: boolean | undefined
}) {
  const handleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogContent className='max-h-[90dvh] overflow-y-scroll'>
          <Tabs defaultValue="Empleados" className="p-2"  >
            <TabsList className="grid w-full grid-cols-2 ">
              <TabsTrigger value="Empleados">Empleados</TabsTrigger>
              <TabsTrigger value="Equipos">Equipos</TabsTrigger>
            </TabsList>
            <TabsContent value="Empleados">
              {multiresource ? (
                <MultiResourceDocument
                  resource="empleado" //empleado o equipo
                  handleOpen={handleOpen} //funcion para abrir/cerrar
                />
              ) : (
                <SimpleDocument
                  resource="empleado" //empleado o equipo
                  handleOpen={handleOpen} //funcion para abrir/cerrar
                />
              )}
            </TabsContent>
            <TabsContent value="Equipos">
              {multiresource ? (
                <MultiResourceDocument
                  resource="equipo" //empleado o equipo
                  handleOpen={handleOpen} //funcion para abrir/cerrar
                />
              ) : (
                <SimpleDocument
                  resource="equipo" //empleado o equipo
                  handleOpen={handleOpen} //funcion para abrir/cerrar
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {/* <SimpleDocument
        resource={resource} //empleado o equipo
        open={open} //abierto por defecto
        handleSimpleModalOpen={handleSimpleModalOpen} //funcion para abrir/cerrar
      />
      <MultiResourceDocument
        resource={resource} //empleado o equipo
        multiresourceOpen={multiresourceOpen} //abierto por defecto
        handleMultiResourceModalOpen={handleMultiResourceModalOpen} //funcion para abrir/cerrar
      /> */}
    </>
  )
}
