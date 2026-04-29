'use server';
import { prisma } from '@/shared/lib/prisma';
import { storageServer } from '@/shared/lib/storage-server';
import { calculateNameOFDocument } from '@/shared/lib/utils';
import { fetchCurrentUser } from '@/shared/actions/auth';

// -- Document state mutations --

export const updateDocumentEmployeeState = async (
  id: string,
  state: string,
  extra?: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_employees.update({
      where: { id },
      data: { state, ...extra } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document employee state:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentEquipmentState = async (
  id: string,
  state: string,
  extra?: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_equipment.update({
      where: { id },
      data: { state, ...extra } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document equipment state:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentCompanyByPath = async (
  documentPath: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_company.updateMany({
      where: { document_path: documentPath },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document company:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentEmployeeByPath = async (
  documentPath: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_employees.updateMany({
      where: { document_path: documentPath },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document employee by path:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentEquipmentByPath = async (
  documentPath: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_equipment.updateMany({
      where: { document_path: documentPath },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document equipment by path:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentById = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  id: string,
  updateData: Record<string, unknown>
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.update({ where: { id }, data: updateData as any });
      return { data, error: null };
    } else if (tableName === 'documents_equipment') {
      const data = await prisma.documents_equipment.update({ where: { id }, data: updateData as any });
      return { data, error: null };
    } else {
      const data = await prisma.documents_company.update({ where: { id }, data: updateData as any });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error updating document by id:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentByAppliesAndType = async (
  tableName: 'documents_employees' | 'documents_equipment',
  appliesId: string,
  documentTypeId: string,
  updateData: Record<string, unknown>
) => {
  try {
    const where: Record<string, unknown> = {
      applies: appliesId,
      id_document_types: documentTypeId,
    };
    // Para documentos mensuales, incluir period en el filtro
    if (updateData.period !== undefined && updateData.period !== null) {
      where.period = updateData.period;
    }

    const model =
      tableName === 'documents_employees'
        ? prisma.documents_employees
        : prisma.documents_equipment;

    const rows = await (model as any).findMany({
      where,
      select: { id: true, document_path: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });

    if (rows.length === 0) {
      // No existe: crear (mantener fallback actual)
      await (model as any).create({
        data: { applies: appliesId, id_document_types: documentTypeId, ...updateData } as any,
      });
      return { data: { count: 1 }, error: null };
    }

    // Seleccionar ganadora: prioridad a la que tiene document_path, sino la más reciente
    const winner = rows.find((r: any) => r.document_path !== null) ?? rows[0];

    // Actualizar solo la ganadora
    const data = await (model as any).update({
      where: { id: winner.id },
      data: updateData as any,
    });

    // Eliminar sobrantes (duplicados)
    const surplusIds = rows.filter((r: any) => r.id !== winner.id).map((r: any) => r.id);
    if (surplusIds.length > 0) {
      await (model as any).deleteMany({
        where: { id: { in: surplusIds } },
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating document by applies and type:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentsByAppliesArrayAndType = async (
  tableName: 'documents_employees' | 'documents_equipment',
  appliesIds: string[],
  documentTypeId: string,
  updateData: Record<string, unknown>
) => {
  try {
    for (const appliesId of appliesIds) {
      const { error } = await updateDocumentByAppliesAndType(
        tableName,
        appliesId,
        documentTypeId,
        updateData
      );
      if (error) return { data: null, error };
    }
    return { data: { count: appliesIds.length }, error: null };
  } catch (error) {
    console.error('Error updating documents by applies array and type:', error);
    return { data: null, error: String(error) };
  }
};

export const deleteDocumentEmployeeById = async (id: string) => {
  try {
    await prisma.documents_employees.delete({ where: { id } });
    return { error: null };
  } catch (error) {
    console.error('Error deleting document employee:', error);
    return { error: String(error) };
  }
};

export const deleteDocumentEquipmentById = async (id: string) => {
  try {
    await prisma.documents_equipment.delete({ where: { id } });
    return { error: null };
  } catch (error) {
    console.error('Error deleting document equipment:', error);
    return { error: String(error) };
  }
};

// -- Upload pending document --

/**
 * Upload de un documento pendiente desde el listado de Documentos.
 * Recibe el FormData con el archivo + datos opcionales (validity, period).
 * Calcula el path en storage, sube el archivo y actualiza la fila a estado 'presentado'.
 */
export async function uploadPendingDocument(formData: FormData) {
  try {
    const rowId = formData.get('rowId') as string;
    const kind = formData.get('kind') as 'employee' | 'equipment';
    const file = formData.get('file') as File | null;
    const validityISO = (formData.get('validity') as string | null) || null;
    const period = (formData.get('period') as string | null) || null;

    if (!rowId || !kind || !file) {
      return { ok: false, error: 'Faltan datos para cargar el documento' };
    }

    const user = await fetchCurrentUser();
    if (!user?.id) return { ok: false, error: 'No autenticado' };

    if (kind === 'employee') {
      const row = await prisma.documents_employees.findUnique({
        where: { id: rowId },
        include: {
          document_type: true,
          employee: { include: { company: true } },
        },
      });
      if (!row || !row.document_type || !row.employee || !row.employee.company) {
        return { ok: false, error: 'Documento no encontrado' };
      }
      if (row.state !== 'pendiente') {
        return { ok: false, error: 'El documento ya no está pendiente' };
      }

      const company = row.employee.company;
      const docType = row.document_type;
      const appliesLabel = `${row.employee.firstname} ${row.employee.lastname}`;
      const fileExtension = file.name.split('.').pop() || 'bin';
      const version = validityISO
        ? new Date(validityISO).toISOString().slice(0, 10).split('-').reverse().join('-')
        : period || 'v0';

      const path = calculateNameOFDocument(
        company.company_name || '',
        company.company_cuit || '',
        appliesLabel,
        docType.name || '',
        version,
        fileExtension,
        'documentos-empleados'
      );

      await storageServer.upload('document_files', path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

      await prisma.documents_employees.update({
        where: { id: rowId },
        data: {
          document_path: path,
          state: 'presentado',
          validity: validityISO,
          period: period,
          created_at: new Date(),
          user_id: user.id,
        },
      });

      return { ok: true };
    }

    // equipment
    const row = await prisma.documents_equipment.findUnique({
      where: { id: rowId },
      include: {
        document_type: true,
        vehicle: { include: { company: true } },
      },
    });
    if (!row || !row.document_type || !row.vehicle || !row.vehicle.company) {
      return { ok: false, error: 'Documento no encontrado' };
    }
    if (row.state !== 'pendiente') {
      return { ok: false, error: 'El documento ya no está pendiente' };
    }

    const company = row.vehicle.company;
    const docType = row.document_type;
    const appliesLabel = (row.vehicle.domain || row.vehicle.serie || row.vehicle.intern_number || '').toLowerCase();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const version = validityISO
      ? new Date(validityISO).toISOString().slice(0, 10).split('-').reverse().join('-')
      : period || 'v0';

    const path = calculateNameOFDocument(
      company.company_name || '',
      company.company_cuit || '',
      appliesLabel,
      docType.name || '',
      version,
      fileExtension,
      'documentos-equipos'
    );

    await storageServer.upload('document_files', path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

    await prisma.documents_equipment.update({
      where: { id: rowId },
      data: {
        document_path: path,
        state: 'presentado',
        validity: validityISO,
        period: period,
        created_at: new Date(),
        user_id: user.id,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error('Error uploading pending document:', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
