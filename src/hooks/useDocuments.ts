'use client';
import { useLoggedUserStore } from '@/store/loggedUser';
import { Documents, DocumentsTable } from '@/types/types';
import { storage, type StorageBucket } from '@/lib/storage';
import { useEdgeFunctions } from './useEdgeFunctions';
import {
  insertSingleDocumentEmployee,
  insertSingleDocumentEquipment,
  updateDocumentById,
  fetchDocumentEmployeesForCompany,
  fetchDocumentEquipmentForCompany,
} from '@/app/server/UPDATE/actions';
import {
  fetchAllDocumentTypes,
  fetchDocumentEmployeesByDocNumber,
  fetchEquipmentDocsByVehicleId,
} from '@/app/server/GET/actions';

export const useDocument = () => {
  const { errorTranslate } = useEdgeFunctions();
  const { actualCompany } = useLoggedUserStore();
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;

  return {
    insertDocumentEmployees: async (documents: Record<string, unknown>) => {
      const { data, error } = await insertSingleDocumentEmployee(documents);

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data ? [data] : [];
    },

    insertDocumentEquipment: async (documents: Record<string, unknown>) => {
      const { data, error } = await insertSingleDocumentEquipment(documents);
      if (error) {
        console.error(error);
      }
      return data ? [data] : [];
    },

    insertMultiDocumentEmployees: async (documents: Record<string, unknown> & { applies: string[] }) => {
      const { applies, ...rest } = documents;

      const insertedRows = [];

      for (const id of applies) {
        const dataWithId = { ...rest, applies: id };
        const { data, error } = await insertSingleDocumentEmployee(dataWithId);

        if (error) {
          const message = await errorTranslate(error);
          throw new Error(String(message).replaceAll('"', ''));
        }

        if (data) insertedRows.push(data);
      }

      return insertedRows;
    },

    insertMultiDocumentEquipment: async (documents: Record<string, unknown> & { applies: string[] }) => {
      const { applies, ...rest } = documents;

      const insertedRows = [];

      for (const id of applies) {
        const dataWithId = { ...rest, applies: id };
        const { data, error } = await insertSingleDocumentEquipment(dataWithId);

        if (error) {
          const message = await errorTranslate(error);
          throw new Error(String(message).replaceAll('"', ''));
        }

        if (data) insertedRows.push(data);
      }

      return insertedRows;
    },

    updateDocumentEquipment: async (id: string, documents: Documents) => {
      const { data, error } = await updateDocumentById('documents_equipment', id, documents as any);

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data ? [data] : [];
    },

    updateDocumentEmployees: async (id: string, documents: Documents) => {
      const { data, error } = await updateDocumentById('documents_employees', id, documents as any);
      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },

    fetchDocumentTypes: async () => {
      try {
        const documentTypesData = await fetchAllDocumentTypes();
        return documentTypesData;
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    },
    fetchDocumentEmployeesByCompany: async () => {
      if (actualCompany) {
        const documents = await fetchDocumentEmployeesForCompany(actualCompany.id);
        return documents;
      }
    },

    fetchDocumentEquipmentByCompany: async () => {
      try {
        if (actualCompany) {
          const documents = await fetchDocumentEquipmentForCompany(actualCompany.id);

          const transformedData = documents?.map((item: any) => ({
            ...item,
            id_document_types: item.document_type?.name,
            applies: item.vehicle?.intern_number,
            domain: item.vehicle?.domain || 'No disponible',
            validity: item.validity || 'No vence',
          })) as DocumentsTable[];

          return transformedData;
        }
      } catch (error) {
        console.error('Error al obtener documentos de equipo:', error);
      }
    },

    uploadDocumentFile: async (file: File, imageBucket: string): Promise<string> => {
      await storage.upload(
        imageBucket as StorageBucket,
        `${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
        file,
        {
          cacheControl: '1',
          upsert: true,
        }
      );

      const imageUrl = `${url}/${imageBucket}/${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`
        .trim()
        .replace(/\s/g, '');

      return imageUrl;
    },

    updateDocumentFile: async (file: File, imageBucket: string): Promise<string> => {
      try {
        await storage.upload(
          imageBucket as StorageBucket,
          `${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
          file,
          {
            cacheControl: '1',
            upsert: true,
          }
        );
      } catch (error: any) {
        const message = await errorTranslate(error?.message || String(error));
        throw new Error(String(message).replaceAll('"', ''));
      }

      const imageUrl = `${url}/${imageBucket}/${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`
        .trim()
        .replace(/\s/g, '');

      return imageUrl;
    },

    fetchEmployeeByDocument: async (document: string) => {
      try {
        const documents_employees = await fetchDocumentEmployeesByDocNumber(document);
        return documents_employees;
      } catch (error) {
        console.error('Error al obtener documentos de empleado:', error);
      }
    },

    fetchEquipmentByDocument: async (id: string) => {
      try {
        const documents_equipment = await fetchEquipmentDocsByVehicleId(id);
        return documents_equipment;
      } catch (error) {
        console.error('Error al obtener documentos de equipo:', error);
      }
    },
  };
};
