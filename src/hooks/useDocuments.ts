'use client'
import { Documents } from "@/types/types"
import { supabase } from "../../supabase/supabase" 
import { useEdgeFunctions } from './useEdgeFunctions'
export const useDocument = () => {
 const { errorTranslate } = useEdgeFunctions()
    
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

    updateDocument: async (id: string, documents: Documents) => {
      const { data, error } = await supabase
        .from('documents')
        .update(documents)
        .eq('id', documents.id)
        .select()

      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },

    fetchAllDocuments: async () => {
      let { data: documents, error } = await supabase.from('documents').select('*')

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
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