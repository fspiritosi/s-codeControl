'use client'
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog'
// import { DocumentsValidation } from '@/store/documentValidation'
// import {
//   LockClosedIcon,
//   LockOpen2Icon,
//   PlusCircledIcon,
// } from '@radix-ui/react-icons'
// import React, { useEffect, useState } from 'react'
// import SimpleDocument from './SimpleDocument'
// import { Loader } from './svg/loader'
// import { Button } from './ui/button'
// import { Checkbox } from './ui/checkbox'
// import { Separator } from './ui/separator'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { useDocument } from '@/hooks/useDocuments'
// import { Badge } from '@/components/ui/badge'
// import { saveAs } from 'file-saver'

// export const DocumentationDrawer = () => {
//   const searchParams = useSearchParams()
//   const id = searchParams.get('id')
//   //////////////////////////////////////////////////////////////
//   let url = ''

//   if (typeof window !== 'undefined') {
//     url = window.location.href
//   }
//   const resource = url.includes('employee')
//     ? 'empleado'
//     : url.includes('equipment')
//       ? 'equipo'
//       : undefined

//   //const searchParams = useSearchParams()
//   const document = searchParams.get('document')

//   ////////////////////////////////////////////////////////////

//   const { fetchEmployeeByDocument, fetchEquipmentByDocument } = useDocument()
//   const [employeeData, setEmployeeData] = useState<any>(null)
//   const [equipmentData, setEquipmentData] = useState<any>(null)

//   const equipment = async () => {
//     try {
//       //console.log('Valor de document:', document)
//       const data = await fetchEquipmentByDocument(id as any)
//       //console.log('Datos obtenidos del equipo:', data)
//       setEquipmentData(data)
//     } catch (error) {
//       console.error('Error al obtener datos del equipo:', error)
//     }
//   }
//   //console.log('equipmentData: ', equipmentData)
//   // useEffect(() => {
//   //equipment()
//   //}, [document, fetchEquipmentByDocument])
//   useEffect(() => {
//     equipment()
//   }, [])

//   const employee = async () => {
//     try {
//       //console.log('Valor de document:', document)
//       const data = await fetchEmployeeByDocument(document as any)
//       //console.log('Datos obtenidos del empleado:', data)
//       setEmployeeData(data)
//     } catch (error) {
//       console.error('Error al obtener datos del empleado:', error)
//     }
//   }

//   useEffect(() => {
//     employee()
//   }, [])

//   //console.log('este es employeeData state: ', employeeData)
//   const getDocumentState = (documentName: string) => {
//     const document = employeeData?.find(
//       (doc: any) => doc.document_types.name === documentName,
//     )
//     return document ? document.state : ''
//   }
//   const getUrlForDocument = (documentName: string) => {
//     if (!employeeData) return ''

//     const document = employeeData.find(
//       (doc: any) => doc.document_types.name === documentName,
//     )
//     return document ? document.document_url : ''
//   }

//   const getDocumentEquipmentState = (documentName: string) => {
//     const document = equipmentData?.find(
//       (doc: any) => doc.document_types.name === documentName,
//     )
//     return document ? document.state : ''
//   }
//   const getUrlForEquipmentDocument = (documentName: string) => {
//     if (!equipmentData) return ''

//     const document = equipmentData.find(
//       (doc: any) => doc.document_types.name === documentName,
//     )
//     return document ? document.document_url : ''
//   }

//   const documentation = [
//     {
//       name: 'Alta Temprana AFIP',
//       url: getUrlForDocument('Alta Temprana AFIP') || '',
//     },
//     {
//       name: 'RELACIONES LABORALES ACTIVAS',
//       url: getUrlForDocument('RELACIONES LABORALES ACTIVAS') || '',
//     },
//     { name: 'DNI', url: getUrlForDocument('DNI') || '' },
//     {
//       name: 'Póliza / Certificado ART',
//       url: getUrlForDocument('Póliza / Certificado ART') || '',
//     },
//     ,
//     {
//       name: 'Póliza / Certificado SVO',
//       url: getUrlForDocument('Póliza / Certificado SVO') || '',
//     },
//     {
//       name: 'Examen medico pre-ocupacional',
//       url: getUrlForDocument('Examen medico pre-ocupacional') || '',
//     },
//     {
//       name: 'Constancia de entrega de Ropa y Epp',
//       url: getUrlForDocument('Constancia de entrega de Ropa y Epp') || '',
//     },
//     {
//       name: 'Licencia Nacional de Conducir',
//       url: getUrlForDocument('Licencia Nacional de Conducir') || '',
//     },
//     {
//       name: 'Carnet Profesional - LINTI',
//       url: getUrlForDocument('Carnet Profesional - LINTI') || '',
//     },
//     {
//       name: 'Carnet de Manejo Defensivo',
//       url: getUrlForDocument('Carnet de Manejo Defensivo') || '',
//     },
//   ]

//   const documentationEquipment = [
//     {
//       name: 'Título de propiedad / Contrato de Alquiler',
//       url:
//         getUrlForEquipmentDocument(
//           'Título de propiedad / Contrato de Alquiler',
//         ) || '',
//     },
//     {
//       name: 'Verificación Tecnica Vehícular',
//       url: getUrlForEquipmentDocument('Verificación Tecnica Vehícular') || '',
//     },
//     {
//       name: 'Habilitación de transporte de Carga (RUTA)',
//       url:
//         getUrlForEquipmentDocument(
//           'Habilitación de transporte de Carga (RUTA)',
//         ) || '',
//     },
//   ]
//   //console.log(documentationEquipment)

//   const [selectAll, setSelectAll] = useState<boolean>(false)
//   const [selectedDocuments, setSelectedDocuments] = useState<any[]>([])
//   const handleSelectAll = () => {
//     if (resource === 'empleado') {
//       if (!selectAll) {
//         const validDocuments = documentation.filter(doc => doc?.url !== '')
//         setSelectedDocuments(validDocuments)
//       } else {
//         setSelectedDocuments([])
//       }
//       setSelectAll(!selectAll)
//     } else {
//       if (!selectAll) {
//         const validDocuments = documentationEquipment.filter(
//           doc => doc?.url !== '',
//         )
//         setSelectedDocuments(validDocuments)
//       } else {
//         setSelectedDocuments([])
//       }
//       setSelectAll(!selectAll)
//     }
//   }

//   const handleDocumentSelect = (document: any) => {
//     const { name, url } = document
//     if (selectedDocuments.some(doc => doc.name === name)) {
//       setSelectedDocuments(selectedDocuments.filter(doc => doc.name !== name))
//     } else {
//       setSelectedDocuments([...selectedDocuments, { name, url }])
//     }
//   }

//   const handleDownloadSelected = () => {
//     selectedDocuments.forEach(document => {
//       const { url } = document
//       if (url) {
//         const fileName = url.substring(url.lastIndexOf('/') + 1)
//         // Descargar el archivo utilizando file-saver
//         saveAs(url, fileName)
//       }
//     })
//   }
//   const getBackgroundColorClass = (state: string) => {
//     switch (state) {
//       case 'presentado':
//         return 'bg-yellow-500' // Amarillo
//       case 'aprobado':
//         return 'bg-green-500' // Verde
//       case 'vencido':
//       case 'rechazado':
//         return 'bg-red-500' // Rojo
//       default:
//         return 'bg-slate-300' // Negro
//     }
//   }

//   const [loading, setLoading] = useState(false)
//   const [open, setOpen] = useState(false)
//   const resetAll = DocumentsValidation(state => state.resetAll)
//   const selectedDocumentation =
//     resource === 'empleado' ? documentation : documentationEquipment

//   const handleOpen = async () => {
//     setOpen(!open)
//     resetAll()
//     setLoading(false)
//     return
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useDocument } from '@/hooks/useDocuments'
import { DocumentsValidation } from '@/store/documentValidation'
import {
  LockClosedIcon,
  LockOpen2Icon,
  PlusCircledIcon,
} from '@radix-ui/react-icons'
import { saveAs } from 'file-saver'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import SimpleDocument from './SimpleDocument'
import { Loader } from './svg/loader'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'

interface DocumentTypes {
  id: number
  name: string
  applies: string
}

export const DocumentationDrawer = () => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  let url = ''

  if (typeof window !== 'undefined') {
    url = window.location.href
  }
  const resource = url.includes('employee')
    ? 'empleado'
    : url.includes('equipment')
      ? 'equipo'
      : undefined

  const document = searchParams.get('document')

  const {
    fetchEmployeeByDocument,
    fetchEquipmentByDocument,
    fetchDocumentTypes,
  } = useDocument()
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [equipmentData, setEquipmentData] = useState<any>(null)
  const [documentTypes, setDocumentTypes] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const data = await fetchEquipmentByDocument(id)
          setEquipmentData(data)
        } else if (document) {
          const data = await fetchEmployeeByDocument(document)
          setEmployeeData(data)
        }
      } catch (error) {
        console.error('Error al obtener datos:', error)
      }
    }
    fetchData()
  }, [id, document, fetchEmployeeByDocument, fetchEquipmentByDocument])
  useEffect(() => {
    const fetchDocument = async () => {
      const documentTypes: any = await fetchDocumentTypes()
      setDocumentTypes(documentTypes)
    }
    fetchDocument()
  }, [])

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

  const documentation = documentTypes
    .filter((docType: DocumentTypes) => docType.applies === 'Persona')
    .map((docType: DocumentTypes) => ({
      name: docType.name,
      url: getUrlForDocument(docType.name) || '',
    }))

  const documentationEquipment = documentTypes
    .filter((docType: DocumentTypes) => docType.applies === 'Equipos')
    .map((docType: DocumentTypes) => ({
      name: docType.name,
      url: getUrlForEquipmentDocument(docType.name) || '',
    }))

  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([])

  const handleSelectAll = () => {
    const selectedDocs =
      resource === 'empleado' ? documentation : documentationEquipment
    setSelectAll(!selectAll)
    if (!selectAll) {
      const validDocuments = selectedDocs.filter(doc => doc?.url !== '')
      setSelectedDocuments(validDocuments)
    } else {
      setSelectedDocuments([])
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
        saveAs(url, fileName)
      }
    })
  }

  const getBackgroundColorClass = (state: string) => {
    switch (state) {
      case 'presentado':
        return 'bg-yellow-500'
      case 'aprobado':
        return 'bg-green-500'
      case 'vencido':
      case 'rechazado':
        return 'bg-red-500'
      default:
        return 'bg-slate-300'
    }
  }

  const [loading, setLoading] = useState(false)
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
    setLoading(true)
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
    setLoading(false)
  }

  const handleClicks = async () => {
    // Ciclo que valida los campos de cada form
    if (hasErrors) {
      setLoading(true)
      await ValidateForms()
      setLoading(false)
    }

    // Si todos los inputs son validos, se hace el ciclo de clicks
    if (!hasErrors) {
      setLoading(true)
      await handleSendForms()
      setLoading(false)
    }
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
    <aside className="bg-slate-800 dark:bg-slate-300 w-[20%] h-full rounded-2xl text-white dark:text-black  p-4 min-w-[300px]">
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
              <div className="flex-grow flex justify-between items-center">
                <div style={{ width: '100px' }}>{doc?.name}</div>{' '}
                <div style={{ width: '90px', textAlign: 'right' }}>
                  {' '}
                  <Badge
                    style={{
                      width: 90,
                      height: 24,
                      lineHeight: '24px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    className={getBackgroundColorClass(
                      resource === 'empleado'
                        ? getDocumentState(doc?.name || '')
                        : getDocumentEquipmentState(doc?.name || ''),
                    )}
                  >
                    {resource === 'empleado'
                      ? getDocumentState(doc?.name || '') || 'faltante'
                      : getDocumentEquipmentState(doc?.name || '') ||
                        'faltante'}
                  </Badge>
                </div>
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
                      <SimpleDocument
                        resource={resource}
                        index={index}
                        handleOpen={handleOpen}
                        refSubmit={refs[index]}
                      />
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
                  <Button disabled={loading} onClick={handleClicks}>
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
