'use server'

import { fetchCurrentUser } from '@/shared/actions/auth';
import { prisma } from '@/shared/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { storageServer } from '@/shared/lib/storage-server'


// Tipos
export type DocumentInput = {
  title: string
  description: string | null
  version: string
  file: File
  expiry_date: string
}


//infer<typeof documentSchema>
export interface DocumentVersion {
  id: string
  version: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  upload_date: string
  created_by: string
  created_at: string
  change_log?: string
  expiry_date: string | null
  description: string | null
  title: string
  status: 'active' | 'vencido' | 'pending' | 'inactive' | 'borrador'
  isCurrent: boolean
  acceptedCount?: number | null
  rejectedCount?: number | null
  totalEmployees?: number | null
  pendingCount?: number | null
  docs_types?: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  version: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  upload_date: string
  expiry_date: string | null
  status: 'active' | 'vencido' | 'pending' | 'inactive' | 'borrador'
  created_by: string
  created_at: string
  updated_at: string
  company_id: string
  versions?: DocumentVersion[]
  tags?: string[]
  docs_types?: {
    id: string;
    name: string;
    short_description: string;
  }
}

interface DocumentAssignment {
  id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  document: {
    id: string;
    title: string;
    version: string;
    expiry_date: string | null;
    docs_types?: string;
  };
  employee: {
    id: string;
    firstname: string;
    lastname: string;
    cuil: string;
    email: string | null;
    hierarchical_position: {
      id: string;
      name: string;
    } | null;
    company_position: string | null;
  } | null;
}

// Interface para los documentos procesados
interface ProcessedDocument {
  assignmentId: string;
  status: string;
  assignedAt: string | null;
  acceptedAt: string | null;
  document: {
    id: string;
    title: string;
    version: string;
    expiryDate: string | null;
  };
}

// Interface para los empleados procesados
export interface ProcessedEmployee {
  id: string
  name: string
  cuil: string
  email: string | null
  position: {
    id: string;
    name: string;
  } | null;
  company_position: string | null
  documents: ProcessedDocument[]
}

// Prisma devuelve Date y BigInt; las acciones entregan strings ISO y numbers
type Serialized<T> = T extends bigint
  ? number
  : T extends Date
    ? string
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

function serialize<T>(value: T): Serialized<T> {
  if (typeof value === 'bigint') return Number(value) as Serialized<T>;
  if (value instanceof Date) return value.toISOString() as Serialized<T>;
  if (Array.isArray(value)) return value.map(serialize) as Serialized<T>;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serialize(v)])
    ) as Serialized<T>;
  }
  return value as Serialized<T>;
}

const docTypesSelect = { select: { id: true, name: true, short_description: true } } as const;

// Obtener todos los documentos con sus etiquetas
export async function getDocuments(company_id: string, filters?: {
  status?: 'active' | 'vencido' | 'pending'
  search?: string
}) {
  let documents;
  try {
    documents = await prisma.hse_documents.findMany({
      where: {
        company_id,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search ? { title: { contains: filters.search, mode: 'insensitive' } } : {}),
      },
      include: {
        docs_types_rel: docTypesSelect,
        hse_document_tag_assignments: { select: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    throw new Error('No se pudieron obtener los documentos')
  }

  if (documents.length === 0) {
    return [];
  }

  // Combinamos los documentos con sus etiquetas
  return documents.map(({ docs_types_rel, hse_document_tag_assignments, ...doc }) => ({
    ...serialize(doc),
    docs_types: docs_types_rel,
    tags: hse_document_tag_assignments.map(assignment => assignment.tag.name),
  })) as unknown as Document[];
}

// Obtener un documento por ID con sus versiones anteriores
export async function getDocumentById(id: string): Promise<(Document & {
  versions: DocumentVersion[];
  tags: string[];
}) | null> {
  try {
    // Obtener el documento principal
    const document = await prisma.hse_documents.findUnique({
      where: { id },
      include: {
        docs_types_rel: docTypesSelect,
        hse_document_tag_assignments: { select: { tag: { select: { id: true, name: true } } } },
        // Obtener las versiones anteriores del documento
        hse_document_versions: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!document) {
      console.error('Error al obtener documento: no encontrado');
      return null;
    }

    const { docs_types_rel, hse_document_tag_assignments, hse_document_versions, ...doc } = document;

    // Eliminar duplicados
    const tags = [...new Set(hse_document_tag_assignments.map(assignment => assignment.tag.name))];

    // Devolver el documento con versiones y etiquetas
    return {
      ...serialize(doc),
      docs_types: docs_types_rel,
      versions: serialize(hse_document_versions),
      tags,
    } as unknown as Document & { versions: DocumentVersion[]; tags: string[] };
  } catch (error) {
    console.error('Error al obtener documento:', error);
    return null;
  }
}

/**
 * Paso 1: valida user/company/título y devuelve el path donde el cliente debe
 * subir el archivo directamente al storage (evita el límite de 4.5MB de Vercel).
 */
export async function prepareHseDocumentCreate(input: {
  companyId: string;
  title: string;
  fileName: string;
}) {
  if (!input.companyId) return { ok: false as const, error: 'Se requiere el ID de la compañía' };
  if (!input.title || !input.fileName) return { ok: false as const, error: 'Título y archivo son obligatorios' };

  const user = await fetchCurrentUser();
  if (!user) return { ok: false as const, error: 'No se pudo autenticar al usuario' };

  const existingDoc = await prisma.hse_documents.findFirst({
    where: { title: input.title, company_id: input.companyId },
    select: { id: true },
  }).catch(() => null);
  if (existingDoc) return { ok: false as const, error: 'El documento ya existe' };

  const fileExt = input.fileName.split('.').pop() || 'bin';
  const path = `${input.companyId}/${Date.now()}.${fileExt}`;
  return { ok: true as const, path, bucket: 'documents-hse' as const };
}

// Devuelve solo los IDs de etiquetas que existen (advierte por las que no)
async function getValidTagIds(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];

  try {
    const existingTags = await prisma.training_tags.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    });
    const existingTagIds = new Set(existingTags.map(tag => tag.id));
    const validTagIds = tagIds.filter(id => existingTagIds.has(id));

    // Registrar advertencia si hay etiquetas no encontradas
    if (validTagIds.length !== tagIds.length) {
      const missingTags = tagIds.filter(id => !existingTagIds.has(id));
      console.warn(`⚠️ Las siguientes etiquetas no existen y no se asignarán: ${missingTags.join(', ')}`);
    }

    return validTagIds;
  } catch (tagsError) {
    console.error('❌ Error al buscar etiquetas existentes:', tagsError);
    return [];
  }
}

/**
 * Paso 2: confirma la creación. Inserta el documento + asignaciones + tags.
 * El archivo ya fue subido por el cliente al path devuelto por prepareHseDocumentCreate.
 */
export async function confirmHseDocumentCreate(input: {
  companyId: string;
  path: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  docs_types: string;
  title: string;
  version: string;
  description?: string | null;
  expiry_date?: string | null;
  typeOfEmployee: string[];
  tags: string[];
}) {
  const { companyId: company_id, path: filePath } = input;

  try {
    if (!company_id) throw new Error('Se requiere el ID de la compañía');

    const user = await fetchCurrentUser();
    if (!user) throw new Error('No se pudo autenticar al usuario');

    const selectedPositions = Array.isArray(input.typeOfEmployee) ? input.typeOfEmployee : [];
    const assignToAll = selectedPositions.length === 0;
    const tagIds = Array.isArray(input.tags) ? input.tags : [];

    const publicUrl = await storageServer.getPublicUrl('documents-hse', filePath);

    // Solo crear asignaciones para etiquetas que existen
    const validTagIds = await getValidTagIds(tagIds);

    const document = await prisma.$transaction(async (tx) => {
      // 8. Crear el documento
      const documentData = await tx.hse_documents.create({
        data: {
          docs_types: input.docs_types,
          title: input.title,
          description: input.description || null,
          version: String(input.version || '1.0'),
          file_path: filePath,
          file_name: input.fileName,
          file_size: input.fileSize,
          file_type: input.fileType,
          upload_date: new Date(),
          expiry_date: input.expiry_date || null,
          status: 'borrador',
          created_by: user.id,
          company_id,
        },
      });

      const documentId = documentData.id;

      // 9. CREAR ASIGNACIONES AUTOMÁTICAS
      await createDocumentAssignments(tx, documentId, company_id, user.id, assignToAll, selectedPositions)

      // 10. CREAR ASIGNACIONES DE ETIQUETAS
      if (validTagIds.length > 0) {
        await tx.hse_document_tag_assignments.createMany({
          data: validTagIds.map(tagId => ({ document_id: documentId, tag_id: tagId })),
        });
      }

      // 10. Obtener el documento actualizado con sus etiquetas
      return tx.hse_documents.findUniqueOrThrow({
        where: { id: documentId },
        include: {
          hse_document_tag_assignments: {
            select: { tag: { select: { id: true, name: true, color: true } } },
          },
        },
      });
    });

    return {
      success: true,
      document: serialize(document),
      publicUrl,
      assignmentsCreated: true,
    }
  } catch (error) {
    console.error("=== Error en la transacción ===")
    console.error("Tipo de error:", typeof error)

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Mensaje de error:", error.message)
      console.error("Stack trace:", error.stack)
    } else {
      console.error("Error desconocido:", error)
    }

    // Intentar limpiar el archivo si existe
    if (filePath) {
      try {

        try {
          await storageServer.remove("documents-hse", [filePath])
        } catch (cleanupError2) {
          console.error("Error al limpiar archivo temporal:", cleanupError2)
        }
      } catch (cleanupError) {
        console.error("Excepción al limpiar archivo temporal:", cleanupError)
      }
    }

    throw new Error(error instanceof Error ? error.message : "Error desconocido al procesar el documento")
  }
}

// Función auxiliar para crear asignaciones
async function createDocumentAssignments(
  tx: Prisma.TransactionClient,
  documentId: string,
  companyId: string,
  assignedBy: string,
  assignToAll: boolean,
  selectedPositions: string[],
) {
  if (assignToAll) {
    // OPCIÓN 1: Asignar a todos los empleados activos de la empresa

    // Obtener todos los empleados activos de la empresa
    const employees = await tx.employees.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, hierarchical_position: true },
    }).catch((employeesError) => {
      console.error("Error al obtener empleados:", employeesError)
      throw new Error("No se pudieron obtener los empleados para asignar")
    })

    if (employees.length > 0) {
      // Crear asignaciones individuales para cada empleado
      // assignee_type es NOT NULL: sin cargo jerárquico se usa 'employee'
      const assignments = employees.map((employee) => ({
        document_id: documentId,
        assignee_type: employee.hierarchical_position ?? 'employee',
        assignee_id: employee.id,
        assigned_by: assignedBy,
        status: "pending" as const,
      }))

      // Insertar en lotes para mejor rendimiento
      await tx.hse_document_assignments.createMany({ data: assignments }).catch((assignmentError) => {
        console.error("Error al crear asignaciones individuales:", assignmentError)
        throw new Error("No se pudieron crear las asignaciones individuales")
      })
    }
  } else if (selectedPositions.length > 0) {
    // OPCIÓN 2: Asignar por posiciones específicas

    // Obtener empleados que coincidan con las posiciones seleccionadas
    const employees = await tx.employees.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        hierarchical_position: { in: selectedPositions },
      },
      select: { id: true, hierarchical_position: true },
    }).catch((employeesError) => {
      console.error("Error al obtener empleados por posición:", employeesError)
      throw new Error("No se pudieron obtener los empleados por posición")
    })

    if (employees.length > 0) {
      // Crear asignaciones individuales
      const assignments = employees.map((employee) => ({
        document_id: documentId,
        assignee_type: employee.hierarchical_position as string,
        assignee_id: employee.id,
        assigned_by: assignedBy,
        status: "pending" as const,
      }))

      await tx.hse_document_assignments.createMany({ data: assignments }).catch((assignmentError) => {
        console.error("Error al crear asignaciones por posición:", assignmentError)
        throw new Error("No se pudieron crear las asignaciones por posición")
      })
    }
  }
}

/**
 * Paso 1: valida documento + nueva versión y devuelve el path para upload directo.
 */
export async function prepareHseDocumentVersion(input: {
  documentId: string;
  companyId: string;
  fileName: string;
  version: string;
}) {
  if (!input.companyId) return { ok: false as const, error: 'Se requiere el ID de la compañía' };
  if (!input.fileName) return { ok: false as const, error: 'El archivo es obligatorio' };

  const user = await fetchCurrentUser();
  if (!user) return { ok: false as const, error: 'No se pudo autenticar al usuario' };

  const existingDoc = await prisma.hse_documents.findUnique({
    where: { id: input.documentId },
    select: { version: true },
  }).catch(() => null);
  if (!existingDoc) return { ok: false as const, error: 'Documento no encontrado' };

  const currentVersion = parseFloat(existingDoc.version);
  const newVersion = input.version ? parseFloat(input.version) : currentVersion + 1;
  if (newVersion <= currentVersion) {
    return {
      ok: false as const,
      error: `No se puede crear una versión (${newVersion}) menor o igual a la actual (${currentVersion})`,
    };
  }

  const fileExt = input.fileName.split('.').pop() || 'bin';
  const path = `${input.companyId}/${Date.now()}.${fileExt}`;
  return { ok: true as const, path, bucket: 'documents-hse' as const };
}

/**
 * Paso 2: confirma la nueva versión. El cliente ya subió el archivo.
 */
export async function confirmHseDocumentVersion(input: {
  documentId: string;
  companyId: string;
  path: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: string;
  expiryDate?: string | null;
  description?: string | null;
}) {
  const { documentId, companyId: company_id, path } = input;
  const filePath: string | null = path;

  try {
    if (!company_id) throw new Error('Se requiere el ID de la compañía');

    const user = await fetchCurrentUser();
    if (!user) throw new Error('No se pudo autenticar al usuario');

    const version = input.version;
    const expiryDate = input.expiryDate || '';
    const description = input.description || '';

    const existingDoc = await prisma.hse_documents.findUnique({
      where: { id: documentId },
    }).catch(() => null);

    if (!existingDoc) throw new Error('Documento no encontrado');

    const currentVersion = parseFloat(existingDoc.version);
    const newVersion = version ? parseFloat(version) : currentVersion + 1;

    if (newVersion <= currentVersion) {
      throw new Error(`No se puede crear una versión (${newVersion}) menor o igual a la versión actual (${currentVersion})`);
    }

    const publicUrl = await storageServer.getPublicUrl('documents-hse', path);

    const document = await prisma.$transaction(async (tx) => {
      // === Guardar la versión anterior en hse_document_versions ===
      const versionInsert = await tx.hse_document_versions.create({
        data: {
          document_id: documentId,
          title: existingDoc.title,
          status: "vencido",
          version: existingDoc.version,
          file_path: existingDoc.file_path,
          file_name: existingDoc.file_name,
          file_size: existingDoc.file_size,
          file_type: existingDoc.file_type,
          created_by: existingDoc.created_by,
          change_log: description || `Versión ${existingDoc.version} - Reemplazada por nueva versión`,
          created_at: existingDoc.updated_at || existingDoc.created_at,
          expiry_date: existingDoc.expiry_date,
          description: existingDoc.description,
        },
        select: { id: true },
      });

      const versionId = versionInsert.id;

      // === Obtener y guardar asignaciones activas como historial ===
      const currentAssignments = await tx.hse_document_assignments.findMany({
        where: { document_id: documentId },
      }).catch((assignmentError) => {
        console.error('Error al obtener asignaciones activas:', assignmentError);
        throw new Error('No se pudieron obtener las asignaciones del documento');
      });

      const versionAssignments = currentAssignments.flatMap((a) =>
        a.assignee_id
          ? [{
              assignment_id: a.id,
              document_version_id: versionId,
              assignee_id: a.assignee_id,
              status: a.status,
              accepted_at: a.accepted_at,
              declined_at: a.declined_at,
              declined_reason: a.declined_reason,
            }]
          : []
      );

      if (versionAssignments.length > 0) {
        await tx.hse_document_assignment_versions.createMany({ data: versionAssignments });
      }

      // === Resetear asignaciones activas a pendiente ===
      await tx.hse_document_assignments.updateMany({
        where: { document_id: documentId },
        data: {
          status: 'pending',
          accepted_at: null,
          declined_at: null,
          declined_reason: null,
        },
      }).catch((resetError) => {
        console.error('Error al resetear asignaciones:', resetError);
        throw new Error('No se pudieron resetear las asignaciones');
      });

      // === Actualizar documento principal con nueva versión ===
      return tx.hse_documents.update({
        where: { id: documentId },
        data: {
          version: version || String(newVersion),
          file_path: filePath,
          file_name: input.fileName,
          file_size: input.fileSize,
          file_type: input.fileType,
          updated_at: new Date(),
          expiry_date: expiryDate || null,
          description: description || null,
          status: 'active',
        },
      });
    });

    return {
      success: true,
      document: serialize(document),
      publicUrl,
    };

  } catch (error) {
    console.error('=== Error en la creación de versión ===');

    if (filePath) {
      try {
        await storageServer.remove('documents-hse', [filePath]);

      } catch (cleanupError) {
        console.error('Error al limpiar archivo temporal:', cleanupError);
      }
    }

    throw new Error(error instanceof Error ? error.message : 'Error desconocido al crear la versión del documento');
  }
}

export async function assignDocumentsToNewEmployee(
  employeeId: string,
  companyId: string,
  employeePosition: string,
) {
  try {
    // 1. Buscar documentos activos que deberían asignarse a este empleado
    // Opción A: Documentos asignados a "todos" (esto requeriría un campo adicional)
    // Opción B: Documentos asignados a la posición específica del empleado

    // Por ahora, implementamos la lógica para asignar documentos activos
    // que no tengan asignación específica para este empleado

    const activeDocuments = await prisma.hse_documents.findMany({
      where: { company_id: companyId, status: 'active' },
      select: { id: true, title: true },
    }).catch((docsError) => {
      console.error("Error al obtener documentos activos:", docsError)
      return null
    })

    if (!activeDocuments || activeDocuments.length === 0) {
      return
    }

    // 2. Verificar qué documentos ya están asignados a este empleado
    const existingAssignments = await prisma.hse_document_assignments.findMany({
      where: { assignee_id: employeeId, assignee_type: 'employee' },
      select: { document_id: true },
    }).catch((assignError) => {
      console.error("Error al verificar asignaciones existentes:", assignError)
      return null
    })

    if (!existingAssignments) return

    const assignedDocIds = existingAssignments.map((a) => a.document_id)

    // 3. Filtrar documentos que no están asignados
    const documentsToAssign = activeDocuments.filter((doc) => !assignedDocIds.includes(doc.id))

    if (documentsToAssign.length === 0) {
      return
    }

    // 4. Crear asignaciones para documentos no asignados
    // TODO: assigned_by es NOT NULL en hse_document_assignments; con null (sistema automático)
    // el insert falla igual que antes. Definir un usuario "sistema" o hacerlo opcional.
    const newAssignments = documentsToAssign.map((doc) => ({
      document_id: doc.id,
      assignee_type: "employee",
      assignee_id: employeeId,
      assigned_by: null as unknown as string, // Sistema automático
      status: "pending" as const,
    }))

    await prisma.hse_document_assignments.createMany({ data: newAssignments }).catch((insertError) => {
      console.error("Error al crear asignaciones automáticas:", insertError)
    })
  } catch (error) {
    console.error("Error en asignación automática a nuevo empleado:", error)
  }
}

export async function getAllHierarchicalPositions() {
  try {
    const data = await prisma.hierarchy.findMany();

    // Eliminar duplicados
    // const uniquePositions = [...new Set(data.map(item => item.name))];

    return { data: serialize(data), error: null };
  } catch (error) {
    console.error('Error al obtener posiciones jerárquicas:', error);
    return { data: null, error: 'Error al obtener las posiciones jerárquicas' };
  }
}

export async function getEmployeesWithAssignedDocuments(companyId: string, documentId?: string) {
  try {
    // 1. Primero obtenemos los empleados de la compañía (con al menos una asignación)
    // Si se proporciona un documentId, lo agregamos al filtro de asignaciones
    const assignmentWhere = documentId ? { document_id: documentId } : {};

    const employees = await prisma.employees.findMany({
      where: {
        company_id: companyId,
        hse_document_assignments: { some: assignmentWhere },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        cuil: true,
        email: true,
        company_id: true,
        hierarchy_rel: { select: { id: true, name: true } },
        company_position: true,
        hse_document_assignments: {
          where: assignmentWhere,
          select: {
            id: true,
            status: true,
            assigned_at: true,
            accepted_at: true,
            document: {
              select: { id: true, title: true, version: true, expiry_date: true },
            },
          },
        },
      },
    });

    if (employees.length === 0) return { data: [], error: null };

    // 2. Procesamos los datos
    const processedData: ProcessedEmployee[] = employees.map(employee => {
      const documents = employee.hse_document_assignments.map(assignment => ({
        assignmentId: assignment.id,
        status: assignment.status,
        assignedAt: assignment.assigned_at.toISOString(),
        acceptedAt: assignment.accepted_at?.toISOString() || null,
        document: {
          id: assignment.document.id,
          title: assignment.document.title,
          version: assignment.document.version,
          expiryDate: assignment.document.expiry_date
        }
      }));

      return {
        id: employee.id,
        name: `${employee.firstname || ''} ${employee.lastname || ''}`.trim(),
        cuil: employee.cuil,
        email: employee.email,
        position: employee.hierarchy_rel
        ? {
            id: employee.hierarchy_rel.id,
            name: employee.hierarchy_rel.name
          }
        : null,
        company_position: employee.company_position || null,
        documents
      };
    });

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error al obtener empleados con documentos asignados:', error);
    return {
      data: null,
      error: 'Error al obtener los empleados con sus documentos asignados'
    };
  }
}

export async function updateDocumentExpiry(documentId: string, expiryDate: string) {
  try {
    const data = await prisma.hse_documents.update({
      where: { id: documentId },
      data: {
        expiry_date: expiryDate,
        updated_at: new Date(), // Opcional: actualizar la fecha de modificación
        status: 'active',
      },
    });

    return serialize(data);
  } catch (error) {
    console.error('Error al actualizar la fecha de vencimiento:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al actualizar la fecha de vencimiento');
  }
}

export interface DocumentVersionAssignment {
  id: string;
  assignment_id: string;
  document_version_id: string;
  assignee_id: string;
  status: string;
  accepted_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  created_at: string;
  employee: {
    id: string;
    firstname: string;
    lastname: string;
    cuil: string;
    email: string | null;
    hierarchical_position: {
      id: string;
      name: string;
    };
    company_position: string | null;
  };
}

export async function getAssignedEmployeesByDocumentVersion(
  documentVersionId: string
): Promise<DocumentVersionAssignment[]> {
  try {
    const data = await prisma.hse_document_assignment_versions.findMany({
      where: { document_version_id: documentVersionId },
      include: {
        assignee: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            cuil: true,
            email: true,
            hierarchy_rel: { select: { id: true, name: true } },
            company_position: true,
          },
        },
      },
    });

    return data.map(({ assignee, ...row }) => {
      const { hierarchy_rel, ...employee } = assignee;
      return {
        ...serialize(row),
        employee: { ...employee, hierarchical_position: hierarchy_rel },
      };
    }) as DocumentVersionAssignment[];
  } catch (error) {
    console.error('Error fetching assigned employees:', error);
    throw new Error('Error al obtener los empleados asignados');
  }
}


export async function createDocument(data: any) {
  try {
    const inserted = await prisma.hse_documents.create({
      data: { ...data, status: "borrador" },
    });
    return serialize(inserted);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error al crear el documento');
  }
}

// Editar documento (solo si status === 'borrador')
export async function editDocument(id: string, data: any) {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const { count } = await tx.hse_documents.updateMany({
        where: { id, status: "borrador" },
        data,
      });
      if (count === 0) return undefined;
      return tx.hse_documents.findUnique({ where: { id } });
    });
    return updated ? serialize(updated) : undefined;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error al editar el documento');
  }
}

// Publicar documento - Cambia el estado de 'borrador' a 'active'
export async function publishDocument(documentId: string) {
  try {
    // Verificar que el documento existe y está en estado 'borrador'
    const document = await prisma.hse_documents.findUnique({
      where: { id: documentId },
      select: { status: true },
    }).catch((fetchError) => {
      console.error('❌ Error al buscar el documento:', fetchError);
      return null;
    });

    if (!document) {
      throw new Error('No se pudo encontrar el documento');
    }

    if (document.status !== 'borrador') {
      throw new Error('Solo se pueden publicar documentos en estado borrador');
    }

    // Actualizar el estado del documento a 'active'
    await prisma.hse_documents.update({
      where: { id: documentId },
      data: {
        status: 'active',
        updated_at: new Date()
      },
    }).catch((updateError) => {
      console.error('❌ Error al publicar el documento:', updateError);
      throw new Error('No se pudo publicar el documento');
    });

    return true;
  } catch (error) {
    console.error('❌ Error en publishDocument:', error);
    throw error;
  }
}

// Eliminar un documento y todas sus asignaciones
export async function deleteDocument(documentId: string) {
  try {
    // 1. Verificar que el documento existe y está en estado 'borrador'
    const document = await prisma.hse_documents.findUnique({
      where: { id: documentId },
      select: { status: true, file_path: true, title: true },
    }).catch((fetchError) => {
      console.error('❌ Error al buscar el documento:', fetchError);
      throw new Error(`No se pudo encontrar el documento: ${fetchError instanceof Error ? fetchError.message : fetchError}`);
    });

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    if (document.status !== 'borrador') {
      throw new Error('Solo se pueden eliminar documentos en estado borrador');
    }

    await prisma.$transaction(async (tx) => {
      // 2. Eliminar las asignaciones de etiquetas
      await tx.hse_document_tag_assignments.deleteMany({
        where: { document_id: documentId },
      }).catch((deleteAssignmentsError) => {
        console.error('❌ Error al eliminar asignaciones de etiquetas:', deleteAssignmentsError);
        throw new Error(`Error al eliminar asignaciones: ${deleteAssignmentsError.message}`);
      });

      // 3. Eliminar asignaciones del documento en hse_document_assignments
      await tx.hse_document_assignments.deleteMany({
        where: { document_id: documentId },
      }).catch((deleteDocumentAssignmentsError) => {
        console.error('❌ Error al eliminar asignaciones del documento:', deleteDocumentAssignmentsError);
        throw new Error(`Error al eliminar asignaciones: ${deleteDocumentAssignmentsError.message}`);
      });

      // 4. Finalmente, eliminar el documento
      await tx.hse_documents.delete({
        where: { id: documentId },
      }).catch((deleteDocError) => {
        console.error('❌ Error al eliminar el documento:', deleteDocError);
        throw new Error(`Error al eliminar el documento: ${deleteDocError.message}`);
      });
    });

    // 5. Si el documento tiene un archivo asociado, intentar eliminarlo del almacenamiento
    if (document.file_path) {
      try {
        await storageServer.remove('documents-hse', [document.file_path]);
      } catch (storageError) {
        console.error('❌ Error inesperado al eliminar archivo del almacenamiento:', storageError);
      }
    }

    return { success: true, message: 'Documento eliminado correctamente' };
  } catch (error) {
    console.error('❌ Error en deleteDocument:', error);
    throw error;
  }
}

/**
 * Paso 1 (opcional): si hay archivo nuevo, devuelve el path para upload directo.
 * Si no hay archivo nuevo, el cliente puede saltarse este paso.
 */
export async function prepareHseDocumentUpdateUpload(input: {
  companyId: string;
  fileName: string;
}) {
  if (!input.companyId) return { ok: false as const, error: 'Se requiere el ID de la compañía' };
  if (!input.fileName) return { ok: false as const, error: 'Nombre de archivo requerido' };

  const ext = input.fileName.split('.').pop() || 'bin';
  const path = `documents/${Date.now()}.${ext}`;
  return { ok: true as const, path, bucket: 'documents-hse' as const };
}

/**
 * Paso 2: confirma el update del documento HSE.
 * Si se subió archivo nuevo, viene `newFilePath` (con metadata del file).
 */
export async function confirmHseDocumentUpdate(input: {
  companyId: string;
  documentId: string;
  newFilePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  docs_types: string;
  title: string;
  version: string;
  description?: string | null;
  expiry_date?: string | null;
  typeOfEmployee: string[];
  tags: string[];
}) {
  const companyId = input.companyId;

  try {
    const user = await fetchCurrentUser();
    if (!user) throw new Error('No se pudo autenticar al usuario');

    const documentId = input.documentId;
    const typeOfEmployee = Array.isArray(input.typeOfEmployee) ? input.typeOfEmployee : [];
    const assignToAll = typeOfEmployee.length === 0;
    const tagIds = Array.isArray(input.tags) ? input.tags : [];

    if (!documentId) throw new Error('ID de documento no proporcionado');

    const filePath: string | undefined = input.newFilePath || undefined;

    // 2. Actualizar metadatos
    const updates = {
      docs_types: input.docs_types,
      title: input.title,
      version: input.version,
      description: input.description || null,
      expiry_date: input.expiry_date || null,
      updated_at: new Date(),
      ...(filePath && {
        file_path: filePath,
        ...(input.fileName ? { file_name: input.fileName } : {}),
        ...(input.fileSize != null ? { file_size: input.fileSize } : {}),
        ...(input.fileType ? { file_type: input.fileType } : {}),
      }),
    };

    // Solo crear asignaciones para etiquetas que existen
    const validTagIds = await getValidTagIds(tagIds);

    const document = await prisma.$transaction(async (tx) => {
      const updated = await tx.hse_documents.update({
        where: { id: documentId },
        data: updates,
      }).catch((updateError) => {
        throw new Error("Error al actualizar el documento: " + updateError.message);
      });

      // 3. Actualizar asignaciones de empleados
      await tx.hse_document_assignments.deleteMany({
        where: { document_id: documentId },
      }).catch((deleteError) => {
        console.error("Error al eliminar asignaciones anteriores:", deleteError);
        throw new Error("No se pudieron actualizar las asignaciones");
      });

      await createDocumentAssignments(
        tx,
        documentId,
        companyId,
        user.id,
        assignToAll,
        typeOfEmployee
      );

      // 4. Actualizar asignaciones de etiquetas
      // Primero eliminamos todas las asignaciones existentes
      await tx.hse_document_tag_assignments.deleteMany({
        where: { document_id: documentId },
      });

      // Luego creamos las nuevas asignaciones si hay etiquetas
      if (validTagIds.length > 0) {
        await tx.hse_document_tag_assignments.createMany({
          data: validTagIds.map(tagId => ({ document_id: documentId, tag_id: tagId })),
        });
      }

      return updated;
    });

    return { success: true, document: serialize(document) };
  } catch (error) {
    console.error("Error en updateDocument:", error);
    throw error;
  }
}

type TypeOfEmployee = {
  id: string;
  name: string;
};

export async function getTypeOfEmployeeForDocument(documentId: string): Promise<{
  data: TypeOfEmployee[] | null;
  error: string | null;
}> {
  try {
    // Primero, buscamos directamente las asignaciones de tipo 'position' para este documento
    const positionAssignments = await prisma.hse_document_assignments.findMany({
      where: { document_id: documentId, assignee_type: 'position' },
      select: { assignee_id: true },
    }).catch((assignmentsError) => {
      console.error('❌ Error al buscar asignaciones:', assignmentsError);
      throw assignmentsError;
    });

    // Si no hay asignaciones, retornamos un array vacío
    if (positionAssignments.length === 0) {
      return { data: [], error: null };
    }

    // Extraemos los IDs de las posiciones, asegurándonos de que no sean nulos
    const positionIds = positionAssignments
      .map((a) => a.assignee_id)
      .filter((id): id is string => id !== null);

    if (positionIds.length === 0) {
      return { data: [], error: null };
    }

    // Obtenemos los detalles de las posiciones desde la tabla hierarchy
    const positions = await prisma.hierarchy.findMany({
      where: { id: { in: positionIds } },
      select: { id: true, name: true },
    }).catch((positionsError) => {
      console.error('❌ Error al buscar las posiciones en hierarchy:', positionsError);
      throw positionsError;
    });

    return {
      data: positions,
      error: null
    };
  } catch (err) {
    console.error('Error al obtener cargos asignados al documento:', err);
    return {
      data: null,
      error: 'No se pudieron obtener las posiciones jerárquicas asignadas al documento.',
    };
  }
}

export async function fetchAllHseDocTypes(companyId: string) {
  try {
    const hse_doc_types = await prisma.hse_doc_types.findMany({ where: { company_id: companyId } });

    return serialize(hse_doc_types);
  } catch (error: unknown) {
    console.error('Error al obtener tipos de documentos:', error);
    return [];
  }
};

export async function fetchHseDocTypesOnlyName(companyId: string) {
  try {
    return await prisma.hse_doc_types.findMany({
      where: { company_id: companyId },
      select: { id: true, name: true },
    });
  } catch (error: unknown) {
    console.error('Error al obtener tipos de documentos:', error);
    return [];
  }
};

export const createDocType = async (data: Database['public']['Tables']['hse_doc_types']['Insert'], companyId: string) => {
  try {
    await prisma.hse_doc_types.create({
      data: {
        id: data.id,
        name: data.name,
        short_description: data.short_description,
        is_active: data.is_active,
        company_id: companyId,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error al crear tipo de documento:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const updateDocType = async (data: Database['public']['Tables']['hse_doc_types']['Update']) => {
  try {
    await prisma.hse_doc_types.update({
      where: { id: data.id || '' },
      data: {
        name: data.name,
        short_description: data.short_description,
        is_active: data.is_active,
        company_id: data.company_id,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error al actualizar tipo de documento:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
