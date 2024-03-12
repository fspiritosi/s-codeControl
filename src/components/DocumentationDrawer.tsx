'use client'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MinusCircledIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import React, { useEffect, useState } from 'react'
import SimpleDocument from './SimpleDocument'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'

export const DocumentationDrawer = () => {
  const documentation = [
    'Documento 1.pdf',
    'Documento 2.pdf',
    'Documento 3.pdf',
    'Documento 4.pdf',
    'Documento 5.pdf',
  ]
  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const handleSelectAll = () => {
    if (!selectAll) {
      setSelectedDocuments([...documentation])
    } else {
      setSelectedDocuments([])
    }
    setSelectAll(!selectAll)
  }

  const handleDocumentSelect = (document: string) => {
    if (selectedDocuments.includes(document)) {
      setSelectedDocuments(selectedDocuments.filter(item => item !== document))
    } else {
      setSelectedDocuments([...selectedDocuments, document])
    }
  }

  let url = ''

  if (typeof window !== 'undefined') {
    url = window.location.href
  }
  const resource = url.includes('employee')
    ? 'empleado'
    : url.includes('equipment')
      ? 'equipo'
      : undefined

  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(!open)
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
    <aside className="bg-slate-800 w-[20%] h-full rounded-2xl  text-white p-4 min-w-[300px]">
      <h2 className="text-center text-xl mb-5">Documentación del empleado</h2>
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
          {documentation.map((doc, index) => (
            <li key={index} className="flex items-center gap-2 ">
              <Checkbox
                className="bg-white"
                checked={selectedDocuments.includes(doc)}
                onClick={() => handleDocumentSelect(doc)}
              />
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>
      <Separator className="my-4" />
      <footer className="bg-white p-4 text-black rounded-2xl flex flex-col justify-center items-center">
        <h3>{selectedDocuments.length} documentos seleccionados</h3>
        <Button variant="primary">Descargar seleccionados</Button>
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
                      {index !== 0 && (
                        <MinusCircledIcon
                          onClick={() => setTotalForms(totalForms - 1)}
                          className="h-4 w-4 shrink-0 absolute right-3 top-1 text-red-800 cursor-pointer"
                        />
                      )}
                      <SimpleDocument
                        resource={resource}
                        index={index}
                        refSubmit={refs[index]}
                      />
                    </div>
                  ))}
                </div>
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
              </div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  )
}

// 'use client'

// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog'
// import { useEffect, useRef, useState } from 'react'
// import SimpleDocument from './SimpleDocument'
// import { Button } from './ui/button'
// import { Checkbox } from './ui/checkbox'
// import { Separator } from './ui/separator'

// export const DocumentationDrawer = () => {
//   const documentation = [
//     'Documento 1.pdf',
//     'Documento 2.pdf',
//     'Documento 3.pdf',
//     'Documento 4.pdf',
//     'Documento 5.pdf',
//   ]
//   const [selectAll, setSelectAll] = useState<boolean>(false)
//   const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
//   const handleSelectAll = () => {
//     if (!selectAll) {
//       setSelectedDocuments([...documentation])
//     } else {
//       setSelectedDocuments([])
//     }
//     setSelectAll(!selectAll)
//   }

//   const handleDocumentSelect = (document: string) => {
//     if (selectedDocuments.includes(document)) {
//       setSelectedDocuments(selectedDocuments.filter(item => item !== document))
//     } else {
//       setSelectedDocuments([...selectedDocuments, document])
//     }
//   }

//   let url = ''

//   if (typeof window !== 'undefined') {
//     url = window.location.href
//   }
//   const resource = url.includes('employee')
//     ? 'empleado'
//     : url.includes('equipment')
//       ? 'equipo'
//       : undefined

//   const [open, setOpen] = useState(false)

//   const handleOpen = () => {
//     setOpen(!open)
//   }

//   const [inputValues, setInputValues] = useState([])
//   useEffect(() => {
//     console.log(inputValues)
//   }, [inputValues])

//   const refSubmit = useRef<HTMLButtonElement>(null)
//   const refButtons = useRef<HTMLButtonElement[]>([])

//   const handleClickAllButtons = () => {
//     refButtons.current.forEach(button => button.click())
//   }

//   return (
//     <aside className="bg-slate-800 w-[20%] h-full rounded-2xl  text-white p-4 min-w-[300px]">
//       <h2 className="text-center text-xl mb-5">Documentación del empleado</h2>
//       <Separator className="mb-4" />
//       {/* <Separator className="mb-4" /> */}
//       <p className="pl-2">
//         <Checkbox
//           className="bg-white"
//           checked={selectAll}
//           onClick={handleSelectAll}
//         />{' '}
//         seleccionar todos
//       </p>
//       <Separator className="mb-4" />
//       <div className="h-full flex flex-col justify-between p-3">
//         <ul className="flex flex-col gap-3">
//           {documentation.map((doc, index) => (
//             <li key={index} className="flex items-center gap-2 ">
//               <Checkbox
//                 className="bg-white"
//                 checked={selectedDocuments.includes(doc)}
//                 onClick={() => handleDocumentSelect(doc)}
//               />
//               <span>{doc}</span>
//             </li>
//           ))}
//         </ul>
//       </div>
//       <Separator className="my-4" />
//       <footer className="bg-white p-4 text-black rounded-2xl flex flex-col justify-center items-center">
//         <h3>{selectedDocuments.length} documentos seleccionados</h3>
//         <Button variant="primary" onClick={handleClickAllButtons}>
//           Descargar seleccionados
//         </Button>
//       </footer>
//       <div className="flex w-full justify-center pt-3">
//         {/* <SimpleDocument resource={resource}/> */}
//         <AlertDialog open={open} onOpenChange={handleOpen}>
//           <AlertDialogTrigger asChild>
//             <Button
//               variant="primary"
//               ref={button => {
//                 if (button) {
//                   refButtons.current.push(button)
//                 }
//               }}
//             >
//               Subir documento
//             </Button>
//           </AlertDialogTrigger>
//           <AlertDialogContent>
//             <AlertDialogHeader>
//               <div className="max-h-[90vh] overflow-y-scroll">
//                 <h2 className="text-lg font-semibold">
//                   Documento No multirecurso
//                 </h2>
//                 <Separator className="my-1" />
//                 <p className="text-sm text-muted-foreground mb-3">
//                   Sube los documentos que necesitas
//                 </p>
//                 <SimpleDocument
//                   resource={resource}
//                   setInputValues={setInputValues}
//                   inputValues={inputValues}
//                   refSubmit={refSubmit}
//                   index={0}
//                 />
//                 <SimpleDocument
//                   setInputValues={setInputValues}
//                   resource={resource}
//                   inputValues={inputValues}
//                   refSubmit={refSubmit}
//                   index={1}
//                 />
//                 <div className="flex justify-evenly">
//                   <Button onClick={handleOpen}>Cancel</Button>
//                   <Button onClick={() => refSubmit.current?.click()}>
//                     Subir documentos
//                   </Button>
//                 </div>
//               </div>
//             </AlertDialogHeader>
//           </AlertDialogContent>
//         </AlertDialog>
//       </div>
//     </aside>
//   )
// }
