'use client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { MinusCircledIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import MultiResourceDocument from './MultiResourceDocument'
import SimpleDocument from './SimpleDocument'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

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

  const [refs, setRefs] = useState<React.RefObject<HTMLButtonElement>[]>([])

  const handleClicks = async () => {
    // Simula un clic en cada botón de submit.
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i]
      if (ref.current) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 segundo antes de cada clic.
        ref.current.click()
      }
    }
  }

  const [totalForms, setTotalForms] = useState(1)

  useEffect(() => {
    // Crea una ref para cada formulario y añádela al estado.
    setRefs(
      Array(totalForms)
        .fill(null)
        .map(() => React.createRef()),
    )
  }, [totalForms])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-scroll">
          <Tabs defaultValue="Empleados" className="p-2">
            <TabsList className="grid w-full grid-cols-2 ">
              <TabsTrigger value="Empleados">Empleados</TabsTrigger>
              <TabsTrigger value="Equipos">Equipos</TabsTrigger>
            </TabsList>
            <TabsContent value="Empleados" className="space-y-2">
              <h2 className="text-lg font-semibold">
                Documento No multirecurso
              </h2>
              <Separator className="my-1" />
              <p className="text-sm text-muted-foreground mb-3">
                Sube los documentos que necesitas
              </p>
              <div className="space-y-3">
                {multiresource ? (
                  <MultiResourceDocument
                    resource="empleado" //empleado o equipo
                    handleOpen={handleOpen} //funcion para abrir/cerrar
                  />
                ) : (
                  Array.from({ length: totalForms }).map((_, index) => (
                    <div key={index} className="relative">
                      {index !== 0 && (
                        <MinusCircledIcon
                          onClick={() => setTotalForms(totalForms - 1)}
                          className="h-4 w-4 shrink-0 absolute right-3 top-1 text-red-800 cursor-pointer"
                        />
                      )}
                      <SimpleDocument
                        resource="empleado"
                        index={index}
                        refSubmit={refs[index]}
                      />
                    </div>
                  ))
                )}
              </div>
              {!multiresource && (
                <>
                  <div className="h-14 flex justify-end items-center">
                    <Button
                      variant="primary"
                      onClick={() => setTotalForms(totalForms + 1)}
                      className="rounded-full "
                    >
                      <PlusCircledIcon className=" h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                  <div className="flex justify-evenly">
                    <Button onClick={handleOpen}>Cancel</Button>
                    <Button onClick={handleClicks}>Subir documentos</Button>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="Equipos">
              <div className='space-y-2'>
                <h2 className="text-lg font-semibold">
                  Documento No multirecurso
                </h2>
                <Separator className="my-1" />
                <p className="text-sm text-muted-foreground mb-3">
                  Sube los documentos que necesitas
                </p>
                {multiresource ? (
                  <MultiResourceDocument
                    resource="equipo" //empleado o equipo
                    handleOpen={handleOpen} //funcion para abrir/cerrar
                  />
                ) : (
                  Array.from({ length: totalForms }).map((_, index) => (
                    <div key={index} className="relative">
                      {index !== 0 && (
                        <MinusCircledIcon
                          onClick={() => setTotalForms(totalForms - 1)}
                          className="h-4 w-4 shrink-0 absolute right-3 top-1 text-red-800 cursor-pointer"
                        />
                      )}
                      <SimpleDocument
                        resource="equipo"
                        index={index}
                        refSubmit={refs[index]}
                      />
                    </div>
                  ))
                )}
              </div>
              {!multiresource && (
                <>
                  <div className="h-14 flex justify-end items-center">
                    <Button
                      variant="primary"
                      onClick={() => setTotalForms(totalForms + 1)}
                      className="rounded-full "
                    >
                      <PlusCircledIcon className=" h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                  <div className="flex justify-evenly">
                    <Button onClick={handleOpen}>Cancel</Button>
                    <Button onClick={handleClicks}>Subir documentos</Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
