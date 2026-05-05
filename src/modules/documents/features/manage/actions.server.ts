'use server';
import { prisma } from '@/shared/lib/prisma';
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

// -- Upload pending document (direct-to-storage pattern) --

interface PreparePendingInput {
  rowId: string;
  kind: 'employee' | 'equipment';
  fileName: string;
  validityISO?: string | null;
  period?: string | null;
}

/**
 * Paso 1: valida permisos y estado, calcula el path en storage.
 * El cliente sube el archivo directo a Supabase Storage (sin pasar por Vercel).
 */
export async function preparePendingDocumentUpload(input: PreparePendingInput) {
  try {
    const { rowId, kind, fileName, validityISO, period } = input;
    if (!rowId || !kind || !fileName) {
      return { ok: false as const, error: 'Faltan datos para cargar el documento' };
    }

    const user = await fetchCurrentUser();
    if (!user?.id) return { ok: false as const, error: 'No autenticado' };

    const fileExtension = fileName.split('.').pop() || 'bin';
    const version = validityISO
      ? new Date(validityISO).toISOString().slice(0, 10).split('-').reverse().join('-')
      : period || 'v0';

    if (kind === 'employee') {
      const row = await prisma.documents_employees.findUnique({
        where: { id: rowId },
        include: {
          document_type: true,
          employee: { include: { company: true } },
        },
      });
      if (!row || !row.document_type || !row.employee || !row.employee.company) {
        return { ok: false as const, error: 'Documento no encontrado' };
      }
      if (row.state !== 'pendiente') {
        return { ok: false as const, error: 'El documento ya no está pendiente' };
      }

      const company = row.employee.company;
      const path = calculateNameOFDocument(
        company.company_name || '',
        company.company_cuit || '',
        `${row.employee.firstname} ${row.employee.lastname}`,
        row.document_type.name || '',
        version,
        fileExtension,
        'documentos-empleados'
      );
      return { ok: true as const, path, bucket: 'document_files' as const };
    }

    const row = await prisma.documents_equipment.findUnique({
      where: { id: rowId },
      include: {
        document_type: true,
        vehicle: { include: { company: true } },
      },
    });
    if (!row || !row.document_type || !row.vehicle || !row.vehicle.company) {
      return { ok: false as const, error: 'Documento no encontrado' };
    }
    if (row.state !== 'pendiente') {
      return { ok: false as const, error: 'El documento ya no está pendiente' };
    }

    const company = row.vehicle.company;
    const appliesLabel = (row.vehicle.domain || row.vehicle.serie || row.vehicle.intern_number || '').toLowerCase();
    const path = calculateNameOFDocument(
      company.company_name || '',
      company.company_cuit || '',
      appliesLabel,
      row.document_type.name || '',
      version,
      fileExtension,
      'documentos-equipos'
    );
    return { ok: true as const, path, bucket: 'document_files' as const };
  } catch (error) {
    console.error('Error preparing pending document:', error);
    return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
  }
}

interface ConfirmPendingInput {
  rowId: string;
  kind: 'employee' | 'equipment';
  path: string;
  validityISO?: string | null;
  period?: string | null;
}

/**
 * Paso 2: confirma el upload y actualiza la fila a 'presentado'.
 * Solo se llama después de que el cliente subió el archivo a storage.
 */
export async function confirmPendingDocumentUpload(input: ConfirmPendingInput) {
  try {
    const { rowId, kind, path, validityISO, period } = input;
    if (!rowId || !kind || !path) {
      return { ok: false, error: 'Faltan datos para confirmar la carga' };
    }

    const user = await fetchCurrentUser();
    if (!user?.id) return { ok: false, error: 'No autenticado' };

    const data = {
      document_path: path,
      state: 'presentado' as const,
      validity: validityISO || null,
      period: period || null,
      created_at: new Date(),
      user_id: user.id,
    };

    if (kind === 'employee') {
      await prisma.documents_employees.update({ where: { id: rowId }, data });
    } else {
      await prisma.documents_equipment.update({ where: { id: rowId }, data });
    }
    return { ok: true };
  } catch (error) {
    console.error('Error confirming pending document:', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
