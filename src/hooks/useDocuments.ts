'use client';
import { useLoggedUserStore } from '@/store/loggedUser';
import { Documents, DocumentsTable } from '@/types/types';
import { supabase } from '../../supabase/supabase';
import { useEdgeFunctions } from './useEdgeFunctions';
require('dotenv').config();
export const useDocument = () => {
  const { errorTranslate } = useEdgeFunctions();
  const { actualCompany } = useLoggedUserStore();
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;

  return {
    insertDocumentEmployees: async (documents: any) => {
      const { data, error } = await supabase.from('documents_employees').insert(documents).select();

      if (error) {
        console.error();
        const message = await errorTranslate(error?.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },

    insertDocumentEquipment: async (documents: any) => {
      const { data, error } = await supabase.from('documents_equipment').insert(documents).select();

      if (error) {
        console.error();
      }
      return data;
    },

    insertMultiDocumentEmployees: async (documents: any) => {
      const { applies, ...rest } = documents; // documents contiene todos los datos excepto los IDs a los que aplica

      const insertedRows = [];

      // Iterar sobre cada id al que aplica
      for (const id of applies) {
        // Combinar los datos restantes con el id actual
        const dataWithId = { ...rest, applies: id };

        // Insertar en la tabla documents_employees
        const { data, error } = await supabase.from('documents_employees').insert(dataWithId).select();

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
        const dataWithId = { ...rest, applies: id };

        const { data, error } = await supabase.from('documents_equipment').insert(dataWithId).select();

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
      const { data, error } = await supabase.from('documents_equipment').update(documents).eq('id', id).select();

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },

    updateDocumentEmployees: async (id: string, documents: Documents) => {
      const { data, error } = await supabase.from('documents_employees').update(documents).eq('id', id);
      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },

    fetchDocumentTypes: async () => {
      try {
        // Consulta los tipos de documento
        const { data: documentTypesData, error: typesError } = await supabase
          .from('document_types')
          .select('*')
          .or(`company_id.eq.${useLoggedUserStore?.getState?.()?.actualCompany?.id},company_id.is.null`);
        if (typesError) {
          throw typesError;
        }
        return documentTypesData;
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    },
    fetchDocumentEmployeesByCompany: async () => {
      if (actualCompany) {
        let { data: documents, error } = await supabase
          .from('documents_employees')
          .select(
            `
            *,
            employees:employees(id,company_id, document_number, lastname, firstname ),
            document_types:document_types(id, name)
        `
          )
          .not('employees', 'is', null)
          .not('document_types', 'is', null)
          .eq('employees.company_id', actualCompany?.id);

        if (error) {
          const message = await errorTranslate(error?.message);
          throw new Error(String(message).replaceAll('"', ''));
        }

        return documents;
      }
    },

    fetchDocumentEquipmentByCompany: async () => {
      try {
        if (actualCompany) {
          let { data: documents, error } = await supabase
            .from('documents_equipment')
            .select(
              `
            *,
            vehicles:vehicles(id,company_id, intern_number, domain),
            document_types:document_types(id, name)
        `
            )
            .not('vehicles', 'is', null)
            .not('document_types', 'is', null)
            .eq('vehicles.company_id', actualCompany?.id);

          const transformedData = documents?.map((item) => ({
            ...item,
            id_document_types: item.document_types.name,
            applies: item.vehicles.intern_number,
            domain: item.vehicles.domain || 'No disponible',
            validity: item.validity || 'No vence',
          })) as DocumentsTable[];

          if (error) {
            const message = await errorTranslate(error?.message);
            throw new Error(String(message).replaceAll('"', ''));
          }

          return transformedData;
        }
      } catch (error) {
        console.error('Error al obtener documentos de equipo:', error);
      }
    },

    uploadDocumentFile: async (file: File, imageBucket: string): Promise<string> => {
      // Subir el documento a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .upload(`${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, file, {
          cacheControl: '1',
          upsert: true,
        });

      if (error) {
      }

      // Obtener la URL de la imagen cargada

      const imageUrl = `${url}/${imageBucket}/${data?.path}`.trim().replace(/\s/g, '');

      return imageUrl;
    },

    updateDocumentFile: async (file: File, imageBucket: string): Promise<string> => {
      // Subir el documento a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .update(`${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, file, {
          cacheControl: '1',
          upsert: true,
        });

      if (error) {
        const message = await errorTranslate(error?.message);
        throw new Error(String(message).replaceAll('"', ''));
      }

      // Obtener la URL de la imagen cargada

      const imageUrl = `${url}/${imageBucket}/${data?.path}`.trim().replace(/\s/g, '');

      return imageUrl;
    },

    fetchEmployeeByDocument: async (document: string) => {
      try {
        let { data: documents_employees, error } = await supabase
          .from('documents_employees')
          .select('*, employees:employees(id, document_number ),  document_types:document_types(name)')
          .not('employees', 'is', null)
          .not('document_types', 'is', null)
          .eq('employees.document_number', document);

        if (error) {
          const message = await errorTranslate(error?.message);
          throw new Error(String(message).replaceAll('"', ''));
        }
        return documents_employees;
      } catch (error) {
        console.error('Error al obtener documentos de empleado:', error);
      }
    },

    fetchEquipmentByDocument: async (id: string) => {
      try {
        let { data: documents_equipment, error } = await supabase
          .from('documents_equipment')
          .select('*, vehicles:vehicles(id, intern_number ),  document_types:document_types(name)')
          .not('vehicles', 'is', null)
          .not('document_types', 'is', null)
          .eq('vehicles.id', id);
        if (error) {
          const message = await errorTranslate(error?.message);
          throw new Error(String(message).replaceAll('"', ''));
        }

        return documents_equipment;
      } catch (error) {
        console.error('Error al obtener documentos de equipo:', error);
      }
    },
  };
};
