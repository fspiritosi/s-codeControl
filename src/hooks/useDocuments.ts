import { id } from 'date-fns/locale';
'use client'
import { useLoggedUserStore } from '@/store/loggedUser'
import { Documents } from "@/types/types"
import { supabase } from "../../supabase/supabase"
import { useEdgeFunctions } from './useEdgeFunctions'
require('dotenv').config()
export const useDocument = () => {
 const { errorTranslate } = useEdgeFunctions()
 const {actualCompany}= useLoggedUserStore()
//  console.log(actualCompany,'actualCompany');
 const url = process.env.NEXT_PUBLIC_PROJECT_URL
    
 return{

    insertDocumentEmployees: async (documents: any) => {
      const { data, error } = await supabase
        .from('documents_employees')
        .insert(documents)
        .select()

      if (error) {
        console.error()
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },

    insertDocumentEquipment: async (documents: any) => {
      const { data, error } = await supabase
        .from('documents_equipment')
        .insert(documents)
        .select()

      if (error) {
        console.error()
        // const message = await errorTranslate(error?.message)
        console.log(error);
      }
      return data
    },

    insertMultiDocumentEmployees: async (documents: any) => {
  const { applies, ...rest } = documents; // documents contiene todos los datos excepto los IDs a los que aplica

  const insertedRows = [];

  // Iterar sobre cada id al que aplica
  for (const id of applies) {
    // Combinar los datos restantes con el id actual
    const dataWithId = { ...rest, applies: id};

    // Insertar en la tabla documents_employees
    const { data, error } = await supabase
      .from('documents_employees')
      .insert(dataWithId)
      .select();

    if (error) {
      console.error();
      const message = await errorTranslate(error?.message);
      throw new Error(String(message).replaceAll('"', ''));
    }

    insertedRows.push(data[0]); // Añadir los datos insertados al array de resultados
  }

  return insertedRows;
},

insertMultiDocumentEquipment: async (documents: any) => {
  const { applies, ...rest } = documents; // documents contiene todos los datos excepto los IDs a los que aplica

  const insertedRows = [];

  // Iterar sobre cada id al que aplica
  for (const id of applies) {
    
    const dataWithId = { ...rest, applies: id};
   
    
    const { data, error } = await supabase
      .from('documents_equipment')
      .insert(dataWithId)
      .select();

    if (error) {
      console.error();
      const message = await errorTranslate(error?.message);
      throw new Error(String(message).replaceAll('"', ''));
    }

    insertedRows.push(data[0]); // Añadir los datos insertados al array de resultados
  }

  return insertedRows;
},

    updateDocumentEquipment: async (id: string, documents: Documents) => {
      const { data, error } = await supabase
        .from('documents_equipment')
        .update(documents)
        .eq('id', id)
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
        .eq('id', id)
        //console.log("id: ", id)
      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },

    fetchDocumentEmployeesByCompany: async () => {
      
    if(actualCompany){
       let { data: documents, error } = await supabase.from('documents_employees').select(`
            *,
            employees:employees(id,company_id, document_number, lastname, firstname ),
            document_types:document_types(id, name)
        `)
        .not('employees', 'is', null)
        .not('document_types', 'is', null)
        .eq('employees.company_id', actualCompany?.id);
        
 

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
     
      // console.log(documents,'documents');
      return documents
    }
    },

    fetchDocumentEquipmentByCompany: async () => {
      
      let { data: documents, error } = await supabase.from('documents_equipment').select(`
            *,
            vehicles:vehicles(id,company_id, intern_number),
            document_types:document_types(id, name)
        `)
        .not('vehicles', 'is', null)
        .not('document_types', 'is', null)
        .eq('vehicles.company_id', actualCompany?.id);
        
 

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
        .upload(`${file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`, file,{
          cacheControl: '1',
          upsert: true,
        })

      if (error) {
        console.log(error,'error');
        // const message = await errorTranslate(error?.message)
        // throw new Error(String(message).replaceAll('"', ''))
      }

      // Obtener la URL de la imagen cargada
       

      const imageUrl = `${url}/${imageBucket}/${data?.path}`.trim().replace(/\s/g, '')

      return imageUrl
    
  },

    updateDocumentFile: async (
    file: File,
    imageBucket: string,
  ): Promise<string> => {
    
     
      // Subir el documento a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .update(`${file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`, file,{
          cacheControl: '1',
          upsert: true,
        })

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }

      // Obtener la URL de la imagen cargada
       

      const imageUrl = `${url}/${imageBucket}/${data?.path}`.trim().replace(/\s/g, '')

      return imageUrl
    
  },

    fetchEmployeeByDocument:async (document:string) => {
      let { data: documents_employees, error } = await supabase
  .from('documents_employees')
  .select('*, employees:employees(id, document_number ),  document_types:document_types(name)')
  .not('employees', 'is', null)    
  .not('document_types', 'is', null)
  .eq('employees.document_number', document)

  //console.log("document employees: ", documents_employees)
  if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
  return documents_employees
    },

    fetchEquipmentByDocument:async (document:string) => {
      let { data: documents_equipment, error } = await supabase
  .from('documents_equipment')
  .select('*, vehicles:vehicles(id, intern_number ),  document_types:document_types(name)'
  )
  .not('vehicles', 'is', null)    
  .not('document_types', 'is', null)
  .eq('vehicles.id', document)
    
  if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }

  return documents_equipment
    },
  }
}