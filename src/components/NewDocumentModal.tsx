'use client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentsValidation } from '@/store/documentValidation'
import {
  LockClosedIcon,
  LockOpen2Icon,
  PlusCircledIcon,
} from '@radix-ui/react-icons'
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
  const [sendingLoading, setSendingLoading] = useState(false)

  const resetAll = DocumentsValidation(state => state.resetAll)
  const handleOpen = () => {
    setIsOpen(!isOpen)
    resetAll()
    setSendingLoading(false)
    return
  }

  const [refs, setRefs] = useState<React.RefObject<HTMLButtonElement>[]>([])
  // const [allInputValids, setAllInputValids] = useState([])
  // const refErrors = useRef<boolean[]>([])

  const hasErrors = DocumentsValidation(state => state.hasErrors)
  const setTotalForms = DocumentsValidation(state => state.setTotalForms)
  const totalForms = DocumentsValidation(state => state.totalForms)

  const ValidateForms = async () => {
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i]
      if (ref.current) {
        ref.current.click()
      }
    }
  }
  const handleSendForms = async () => {
    await Promise.all(
      refs.map(async (ref, i) => {
        if (ref.current) {
          if (i === 0) {
            ref.current.click()
          } else {
            await new Promise(resolve => setTimeout(resolve, 500)) // 0.5 segundos antes de cada clic.
            ref.current?.click()
          }
        }
      }),
    )
  }
  // const router = useRouter()

  const handleClicks = async () => {
    // Ciclo que valida los campos de cada input
    setSendingLoading(true)

    if (hasErrors) {
      await ValidateForms()
    }

    // Si todos los inputs son validos, se hace el ciclo de clicks
    if (!hasErrors) {
      await handleSendForms()
    }
    setSendingLoading(false)
  }

  // const [totalForms] = useState(1)

  const fillRef = () => {
    setRefs(
      Array(totalForms)
        .fill(null)
        .map(() => React.createRef()),
    )
  }

  const addDocumentsErrors = DocumentsValidation(
    state => state.addDocumentsErrors,
  )

  useEffect(() => {
    // Crea una ref para cada formulario y añádela al estado.
    fillRef()
  }, [totalForms])

  const handleNewForm = () => {
    setTotalForms(true)
    addDocumentsErrors(totalForms + 1)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto dark:bg-slate-950">
          <Tabs defaultValue="Empleados" className="p-2">
            <TabsList className="grid w-full grid-cols-2 ">
              <TabsTrigger value="Empleados">Empleados</TabsTrigger>
              <TabsTrigger value="Equipos">Equipos</TabsTrigger>
            </TabsList>
            <TabsContent
              value="Empleados"
              className="space-y-2 dark:bg-slate-950"
            >
              {!multiresource && (
                <>
                  {' '}
                  <h2 className="text-lg font-semibold">
                    Documento No multirecurso
                  </h2>
                  <Separator className="my-1" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Sube los documentos que necesitas
                  </p>
                </>
              )}
              <div className="space-y-3">
                {multiresource ? (
                  <MultiResourceDocument
                    resource="empleado" //empleado o equipo
                    handleOpen={handleOpen} //funcion para abrir/cerrar
                  />
                ) : (
                  Array.from({ length: totalForms }).map((_, index) => (
                    <div key={index} className="relative">
                      <SimpleDocument
                        resource="empleado"
                        handleOpen={handleOpen}
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
                      onClick={handleNewForm}
                      className="rounded-full "
                    >
                      <PlusCircledIcon className=" h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                  <div className="flex justify-evenly">
                    <Button onClick={() => handleOpen()}>Cancel</Button>
                    <Button disabled={sendingLoading} onClick={handleClicks}>
                      {sendingLoading ? (
                        hasErrors ? (
                          'Validando...'
                        ) : (
                          'Subiendo...'
                        )
                      ) : (
                        <>
                          {hasErrors ? (
                            <LockClosedIcon className="mr-2" />
                          ) : (
                            <LockOpen2Icon className="mr-2" />
                          )}
                          {hasErrors
                            ? 'Validar documentos'
                            : 'Subir documentos'}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="Equipos">
              <div className="space-y-2">
                {!multiresource && (
                  <>
                    {' '}
                    <h2 className="text-lg font-semibold">
                      Documento No multirecurso
                    </h2>
                    <Separator className="my-1" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Sube los documentos que necesitas
                    </p>
                  </>
                )}
                {multiresource ? (
                  <MultiResourceDocument
                    resource="equipo" //empleado o equipo
                    handleOpen={handleOpen} //funcion para abrir/cerrar
                  />
                ) : (
                  Array.from({ length: totalForms }).map((_, index) => (
                    <div key={index} className="relative">
                      <SimpleDocument
                        resource="equipo"
                        index={index}
                        handleOpen={handleOpen}
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
                      onClick={handleNewForm}
                      className="rounded-full "
                    >
                      <PlusCircledIcon className=" h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                  <div className="flex justify-evenly">
                    <Button onClick={() => handleOpen()}>Cancel</Button>
                    <Button disabled={sendingLoading} onClick={handleClicks}>
                      {sendingLoading ? (
                        <>Validando...</>
                      ) : (
                        <>
                          {hasErrors ? (
                            <LockClosedIcon className="mr-2" />
                          ) : (
                            <LockOpen2Icon className="mr-2" />
                          )}
                          {hasErrors
                            ? 'Validar documentos'
                            : 'Subir documentos'}
                        </>
                      )}
                    </Button>
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
