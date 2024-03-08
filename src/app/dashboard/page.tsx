'use client'
import { useDocument } from '@/hooks/useDocuments'
import { Documents } from '@/types/types'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useState, ChangeEvent } from 'react'
export default function Home() {
  // const {
  //   insertDocument,
  //   fetchDocumentEmployeesByCompany,
  //   fetchDocumentEquipmentByCompany,
  //   updateDocumentEquipment,
  //   uploadDocumentFile,
  // } = useDocument()

  //const profile = useLoggedUserStore(state => state.profile)
  // const testDocument: Documents = {
  //   id_storage: null,
  //   id_document_types: 'c3e99321-d762-4ee1-af3b-2752d3e71447',
  //   applies_equipment: null,
  //   applies_employee: '1e1d0d2f-fa8b-458b-89c9-b35b2a614eb9',
  //   validity: new Date('2024-12-31'), // Fecha de validez
  //   state: 'presentado', // Debes asignar un valor de tu enumeración aquí
  //   is_active: true,
  // }

  // const testDocument1: Documents = {
  //   id: '5832a7af-4629-4b65-8df0-d170ef009bc0',
  //   id_storage: null,
  //   id_document_types: '209dcb22-eea9-4a2b-a0f2-678e813c99db',
  //   applies: '73abd2b4-b8df-4576-b31e-28e1d8bc88d3',
  //   validity: null,
  //   state: 'vencido',
  //   is_active: true,
  //   user_id: undefined,
  // }

  // //console.log(testDocument)
  // const testFetch = async () => {
  //   try {
  //     const documents = await fetchDocumentEquipmentByCompany()
  //     console.log('Documentos recuperados:', documents)
  //   } catch (error) {
  //     console.error('Error al recuperar documentos:', error)
  //   }
  // }
  // insertDocument(testDocument1)
  // testFetch()
  // updateDocumentEquipment('5832a7af-4629-4b65-8df0-d170ef009bc0', {
  //   ...testDocument1,
  //   //user_id: profile?.[0].id,
  // })

  /////////////////////////////
  // const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files
  //   if (files && files.length > 0) {
  //     setSelectedFile(files[0])
  //   }
  // }

  // const handleUpload = async () => {
  //   if (selectedFile) {
  //     try {
  //       const imageUrl = await uploadDocumentFile(
  //         selectedFile,
  //         'document_files',
  //       )
  //       console.log('URL del archivo cargado:', imageUrl)
  //       // Aquí puedes hacer lo que necesites con la URL del archivo cargado
  //     } catch (error) {
  //       console.error('Error al cargar el archivo:', error)
  //     }
  //   }
  // }
  return (
    <div className="flex flex-col ml-64 items-center justify-center min-h-screen py-2">
      home
      {/* <div>
        <input type="file" id="fileInput" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile}>
          Subir Archivo
        </button>
      </div> */}
    </div>
  )
}
