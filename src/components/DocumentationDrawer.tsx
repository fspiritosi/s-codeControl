'use client'

import { useState } from 'react'
import SimpleDocument from './SimpleDocument'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'
import NewDocumentModal from './NewDocumentModal'

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
      <SimpleDocument resource={resource}/>
      </div>
    </aside>
  )
}
