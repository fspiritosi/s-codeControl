'use client'
import { Documents } from "@/types/types"
import { supabase } from "../../supabase/supabase" 
import { useEdgeFunctions } from './useEdgeFunctions'
import { useLoggedUserStore } from '@/store/loggedUser'
export const useDocument = () => {
 const { errorTranslate } = useEdgeFunctions()
 const {actualCompany}= useLoggedUserStore()
    
 return{

    insertDocument: async (documents: Documents) => {
      const { data, error } = await supabase
        .from('documents')
        .insert(documents)
        .select()

      if (error) {
        console.error()
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },

    updateDocumentEquipment: async (id: string, documents: Documents) => {
      const { data, error } = await supabase
        .from('documents_equipment')
        .update(documents)
        .eq('id', documents.id)
        .select()

      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },

    updateDocumentEmployees: async (id: string, documents: Documents) => {
      const { data, error } = await supabase
        .from('documents_employees')
        .update(documents)
        .eq('id', documents.id)
        .select()

      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },
    fetchDocumentEmployeesByCompany: async () => {
      console.log("este es actualCompany: ", actualCompany)
      let { data: documents, error } = await supabase.from('documents_employees').select(`
            *,
            employees:employees(id, company_id)
        `)
        .not('employees', 'is', null)
        .eq('employees.company_id', actualCompany?.id);
        
 

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      console.log('document: ', documents)
      return documents
    },

    fetchDocumentEquipmentByCompany: async () => {
      //console.log("este es actualCompany: ", actualCompany)
      //let { data: documents, error } = await supabase.from('documents_equipment').select()
      let { data: documents, error } = await supabase.from('documents_equipment').select(`
            *,
            vehicles:vehicles(id, company_id)
        `)
        .not('vehicles', 'is', null)
        .eq('vehicles.company_id', actualCompany?.id);
        
 

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      console.log('document: ', documents)
      return documents
    },

    uploadDocumentFile: async (
    file: File,
    imageBucket: string,
  ): Promise<string> => {
    
     
      // Subir el documento a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .upload(`${file.name}`, file,{
          cacheControl: '1',
          upsert: true,
        })

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }

      // Obtener la URL de la imagen cargada
       

      const imageUrl = `https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/${imageBucket}/${data?.path}`

      return imageUrl
    
  },

    updateDocumentFile: async (
    file: File,
    imageBucket: string,
  ): Promise<string> => {
    
     
      // Subir el documento a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .update(`${file.name}`, file,{
          cacheControl: '1',
          upsert: true,
        })

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }

      // Obtener la URL de la imagen cargada
       

      const imageUrl = `https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/${imageBucket}/${data?.path}`

      return imageUrl
    
  },
  }
}