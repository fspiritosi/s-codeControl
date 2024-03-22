'use client'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DocumentsValidation } from '@/store/documentValidation'
import {
  LockClosedIcon,
  LockOpen2Icon,
  PlusCircledIcon,
} from '@radix-ui/react-icons'
import React, { useEffect, useState } from 'react'
import SimpleDocument from './SimpleDocument'
import { Loader } from './svg/loader'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDocument } from '@/hooks/useDocuments'
import { Badge } from '@/components/ui/badge'
import { saveAs } from 'file-saver'

export const DocumentationDrawer = () => {
  // const document = searchParams.get('id')
  //////////////////////////////////////////////////////////////
  let url = ''

  if (typeof window !== 'undefined') {
    url = window.location.href
  }
  const resource = url.includes('employee')
    ? 'empleado'
    : url.includes('equipment')
      ? 'equipo'
      : undefined

  const searchParams = useSearchParams()
  const document =
    resource === 'empleado'
      ? searchParams.get('document')
      : searchParams.get('id')
  ////////////////////////////////////////////////////////////

  const { fetchEmployeeByDocument, fetchEquipmentByDocument } = useDocument()
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [equipmentData, setEquipmentData] = useState<any>(null)

  const equipment = async () => {
    //console.log('Valor de document:', document)
    const data = await fetchEquipmentByDocument(document as any)
    //console.log('Datos obtenidos del equipo:', data)
    setEquipmentData(data)
  }
  //console.log('equipmentData: ', equipmentData)
  // useEffect(() => {
  //equipment()
  //}, [document, fetchEquipmentByDocument])
  useEffect(() => {
    equipment()
  }, [])
  const employee = async () => {
    //console.log('Valor de document:', document)
    const data = await fetchEmployeeByDocument(document as any)
    //console.log('Datos obtenidos del empleado:', data)
    setEmployeeData(data)
  }

  useEffect(() => {
    employee()
  }, [])

  //console.log('este es employeeData state: ', employeeData)
  const getDocumentState = (documentName: string) => {
    const document = employeeData?.find(
      (doc: any) => doc.document_types.name === documentName,
    )
    return document ? document.state : ''
  }
  const getUrlForDocument = (documentName: string) => {
    if (!employeeData) return ''

    const document = employeeData.find(
      (doc: any) => doc.document_types.name === documentName,
    )
    return document ? document.document_url : ''
  }

  const documentation = [
    {
      name: 'Alta Temprana AFIP',
      url: getUrlForDocument('Alta Temprana AFIP') || '',
    },
    {
      name: 'RELACIONES LABORALES ACTIVAS',
      url: getUrlForDocument('RELACIONES LABORALES ACTIVAS') || '',
    },
    { name: 'DNI', url: getUrlForDocument('DNI') || '' },
    {
      name: 'Póliza / Certificado ART',
      url: getUrlForDocument('Póliza / Certificado ART') || '',
    },
    ,
    {
      name: 'Póliza / Certificado SVO',
      url: getUrlForDocument('Póliza / Certificado SVO') || '',
    },
    {
      name: 'Examen medico pre-ocupacional',
      url: getUrlForDocument('Examen medico pre-ocupacional') || '',
    },
    {
      name: 'Constancia de entrega de Ropa y Epp',
      url: getUrlForDocument('Constancia de entrega de Ropa y Epp') || '',
    },
    {
      name: 'Licencia Nacional de Conducir',
      url: getUrlForDocument('Licencia Nacional de Conducir') || '',
    },
    {
      name: 'Carnet Profesional - LINTI',
      url: getUrlForDocument('Carnet Profesional - LINTI') || '',
    },
    {
      name: 'Carnet de Manejo Defensivo',
      url: getUrlForDocument('Carnet de Manejo Defensivo') || '',
    },
  ]

  const getDocumentEquipmentState = (documentName: string) => {
    const document = equipmentData?.find(
      (doc: any) => doc.document_types.name === documentName,
    )
    return document ? document.state : ''
  }
  const getUrlForEquipmentDocument = (documentName: string) => {
    if (!equipmentData) return ''

    const document = equipmentData.find(
      (doc: any) => doc.document_types.name === documentName,
    )
    return document ? document.document_url : ''
  }
  const documentationEquipment = [
    {
      name: 'Título de propiedad / Contrato de Alquiler',
      url:
        getUrlForEquipmentDocument(
          'Título de propiedad / Contrato de Alquiler',
        ) || '',
    },
    {
      name: 'Verificación Tecnica Vehícular',
      url: getUrlForEquipmentDocument('Verificación Tecnica Vehícular') || '',
    },
    {
      name: 'Habilitación de transporte de Carga (RUTA)',
      url:
        getUrlForEquipmentDocument(
          'Habilitación de transporte de Carga (RUTA)',
        ) || '',
    },
  ]
  //console.log(documentationEquipment)

  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([])
  const handleSelectAll = () => {
    if (resource === 'empleado') {
      if (!selectAll) {
        const validDocuments = documentation.filter(doc => doc?.url !== '')
        setSelectedDocuments(validDocuments)
      } else {
        setSelectedDocuments([])
      }
      setSelectAll(!selectAll)
    } else {
      if (!selectAll) {
        const validDocuments = documentationEquipment.filter(
          doc => doc?.url !== '',
        )
        setSelectedDocuments(validDocuments)
      } else {
        setSelectedDocuments([])
      }
      setSelectAll(!selectAll)
    }
  }

  const handleDocumentSelect = (document: any) => {
    const { name, url } = document
    if (selectedDocuments.some(doc => doc.name === name)) {
      setSelectedDocuments(selectedDocuments.filter(doc => doc.name !== name))
    } else {
      setSelectedDocuments([...selectedDocuments, { name, url }])
    }
  }

  const handleDownloadSelected = () => {
    selectedDocuments.forEach(document => {
      const { url } = document
      if (url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1)
        // Descargar el archivo utilizando file-saver
        saveAs(url, fileName)
      }
    })
  }
  const getBackgroundColorClass = (state: string) => {
    switch (state) {
      case 'presentado':
        return 'bg-yellow-500' // Amarillo
      case 'aprobado':
        return 'bg-green-500' // Verde
      case 'vencido':
      case 'rechazado':
        return 'bg-red-500' // Rojo
      default:
        return 'bg-slate-300' // Negro
    }
  }

  const setLoading = DocumentsValidation(state => state.setLoading)
  const loading = DocumentsValidation(state => state.loading)
  // let url = ''

  // if (typeof window !== 'undefined') {
  //   url = window.location.href
  // }
  // const resource = url.includes('employee')
  //   ? 'empleado'
  //   : url.includes('equipment')
  //     ? 'equipo'
  //     : undefined

  const [open, setOpen] = useState(false)
  const resetAll = DocumentsValidation(state => state.resetAll)
  const selectedDocumentation =
    resource === 'empleado' ? documentation : documentationEquipment

  const handleOpen = async () => {
    setOpen(!open)
    resetAll()
    setLoading(false)
    return
  }

  const [refs, setRefs] = useState<React.RefObject<HTMLButtonElement>[]>([])
  const hasErrors = DocumentsValidation(state => state.hasErrors)
  const deleteDocument = DocumentsValidation(state => state.deleteDocument)
  const setTotalForms = DocumentsValidation(state => state.setTotalForms)
  const totalForms = DocumentsValidation(state => state.totalForms)
  const addDocumentsErrors = DocumentsValidation(
    state => state.addDocumentsErrors,
  )

  const ValidateForms = async () => {
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i]
      if (ref.current) {
        if (i === 0) {
          ref.current.click()
        } else {
          ref.current.click()
        }
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

  const handleClicks = async () => {
    // Ciclo que valida los campos de cada form
    if (hasErrors) await ValidateForms()

    // Si todos los inputs son validos, se hace el ciclo de clicks
    if (!hasErrors) await handleSendForms()
  }

  const fillRef = () => {
    setRefs(
      Array(totalForms)
        .fill(null)
        .map(() => React.createRef()),
    )
  }

  useEffect(() => {
    // Crea una ref para cada formulario y añádela al estado.
    fillRef()
  }, [totalForms])
  const handleNewForm = () => {
    setTotalForms(true)
    addDocumentsErrors(totalForms + 1)
  }

  return (
    <aside className="bg-slate-800 w-[20%] h-full rounded-2xl  text-white p-4 min-w-[300px]">
      <h2 className="text-center text-xl mb-5">
        {resource === 'empleado'
          ? 'Documentación del empleado'
          : 'Documentacion del equipo'}
      </h2>
      <Separator className="mb-4" />
      {/* <Separator className="mb-4" /> */}
      <p className="pl-2">
        <Checkbox
          className="bg-white"
          checked={selectAll}
          onClick={handleSelectAll}
        />{' '}
        seleccionar todos
      </p>
      <Separator className="mb-4" />
      <div className="h-full flex flex-col justify-between p-3">
        <ul className="flex flex-col gap-3">
          {selectedDocumentation.map((doc, index) => (
            <li key={index} className="flex items-center gap-2 ">
              <Checkbox
                className="bg-white"
                checked={selectedDocuments.some(
                  selected => selected.name === doc?.name,
                )}
                onClick={() => handleDocumentSelect(doc)}
              />
              <div className="flex items-center justify-between flex-grow">
                <span>{doc?.name}</span>

                <Badge
                  className={getBackgroundColorClass(
                    resource === 'empleado'
                      ? getDocumentState(doc?.name || '')
                      : getDocumentEquipmentState(doc?.name || ''),
                  )}
                >
                  {resource === 'empleado'
                    ? getDocumentState(doc?.name || '') || 'No presentado'
                    : getDocumentEquipmentState(doc?.name || '') ||
                      'No presentado'}
                  ;
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Separator className="my-4" />
      <footer className="bg-white p-4 text-black rounded-2xl flex flex-col justify-center items-center">
        <h3>{selectedDocuments.length} documentos seleccionados</h3>
        <Button variant="primary" onClick={handleDownloadSelected}>
          Descargar seleccionados
        </Button>
      </footer>
      <div className="flex w-full justify-center pt-3">
        {/* <SimpleDocument resource={resource}/> */}
        <AlertDialog open={open} onOpenChange={handleOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="primary">Subir documento</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="max-h-[90vh] overflow-y-scroll">
                <h2 className="text-lg font-semibold">
                  Documento No multirecurso
                </h2>
                <Separator className="my-1" />
                <p className="text-sm text-muted-foreground mb-3">
                  Sube los documentos que necesitas
                </p>
                <div className="space-y-3">
                  {Array.from({ length: totalForms }).map((_, index) => (
                    <div key={index} className="relative">
                      {/* <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        defaultValue="item-1"
                        asChild
                      >
                        <AccordionItem value={`item-${index + 1}`}>
                          <AccordionTrigger
                            defaultValue="item-1"
                            className="text-lg flex relative"
                          >{`Documento ${index + 1}`}</AccordionTrigger>
                          <AccordionContent>
                            {index !== 0 && (
                              <MinusCircledIcon
                                onClick={() => {
                                  setTotalForms(false)
                                  deleteDocument(index)
                                }}
                                className="h-4 w-4 shrink-0 absolute right-3 top-1 text-red-800 cursor-pointer"
                              />
                            )} */}
                      <SimpleDocument
                        resource={resource}
                        index={index}
                        handleOpen={handleOpen}
                        refSubmit={refs[index]}
                      />
                      {/* </AccordionContent>
                        </AccordionItem>
                      </Accordion> */}
                    </div>
                  ))}
                </div>
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
                  <Button onClick={handleOpen}>Cancel</Button>
                  <Button onClick={handleClicks}>
                    {loading ? (
                      <Loader />
                    ) : (
                      <>
                        {hasErrors ? (
                          <LockClosedIcon className="mr-2" />
                        ) : (
                          <LockOpen2Icon className="mr-2" />
                        )}
                        {hasErrors ? 'Validar documentos' : 'Subir documentos'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  )
}
