'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';

// ============================================================
// Hierarchy (Puestos Jerárquicos)
// ============================================================

export async function getHierarchyParameters() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    return await prisma.hierarchy.findMany({
      where: { OR: [{ company_id: companyId }, { company_id: null }] },
      orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    });
  } catch (error) {
    console.error('Error in getHierarchyParameters:', error);
    return [];
  }
}

export async function createHierarchyParameter(name: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  const trimmed = name.trim();
  if (!trimmed) return { error: 'El nombre no puede estar vacío' };

  try {
    const existing = await prisma.hierarchy.findFirst({
      where: {
        name: { equals: trimmed, mode: 'insensitive' },
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { id: true, company_id: true },
    });
    if (existing) {
      return { error: 'Ya existe un puesto con ese nombre' };
    }

    await prisma.hierarchy.create({
      data: { name: trimmed, company_id: companyId, is_active: true },
    });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error creating hierarchy:', error);
    return { error: String(error) };
  }
}

export async function updateHierarchyParameter(id: string, name: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  const trimmed = name.trim();
  if (!trimmed) return { error: 'El nombre no puede estar vacío' };

  try {
    const current = await prisma.hierarchy.findUnique({ where: { id } });
    if (!current) return { error: 'Puesto no encontrado' };
    if (current.company_id && current.company_id !== companyId) {
      return { error: 'No se puede editar un puesto de otra empresa' };
    }
    if (current.company_id === null) {
      return { error: 'No se puede editar un puesto de catálogo del sistema' };
    }

    const duplicate = await prisma.hierarchy.findFirst({
      where: {
        id: { not: id },
        name: { equals: trimmed, mode: 'insensitive' },
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { id: true },
    });
    if (duplicate) return { error: 'Ya existe un puesto con ese nombre' };

    await prisma.hierarchy.update({ where: { id }, data: { name: trimmed } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error updating hierarchy:', error);
    return { error: String(error) };
  }
}

export async function toggleHierarchyParameterActive(id: string, isActive: boolean) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  try {
    const current = await prisma.hierarchy.findUnique({ where: { id } });
    if (!current) return { error: 'Puesto no encontrado' };
    if (current.company_id && current.company_id !== companyId) {
      return { error: 'No se puede modificar un puesto de otra empresa' };
    }
    if (current.company_id === null) {
      return { error: 'No se puede modificar un puesto de catálogo del sistema' };
    }

    await prisma.hierarchy.update({ where: { id }, data: { is_active: isActive } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error toggling hierarchy:', error);
    return { error: String(error) };
  }
}

// ============================================================
// Work Diagram (Diagramas de Trabajo)
// ============================================================

export async function getWorkDiagramParameters() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    return await prisma.work_diagram.findMany({
      where: { OR: [{ company_id: companyId }, { company_id: null }] },
      orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    });
  } catch (error) {
    console.error('Error in getWorkDiagramParameters:', error);
    return [];
  }
}

export async function createWorkDiagramParameter(name: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  const trimmed = name.trim();
  if (!trimmed) return { error: 'El nombre no puede estar vacío' };

  try {
    const existing = await prisma.work_diagram.findFirst({
      where: {
        name: { equals: trimmed, mode: 'insensitive' },
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { id: true },
    });
    if (existing) return { error: 'Ya existe un diagrama con ese nombre' };

    await prisma.work_diagram.create({
      data: { name: trimmed, company_id: companyId, is_active: true },
    });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error creating work diagram:', error);
    return { error: String(error) };
  }
}

export async function updateWorkDiagramParameter(id: string, name: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  const trimmed = name.trim();
  if (!trimmed) return { error: 'El nombre no puede estar vacío' };

  try {
    const current = await prisma.work_diagram.findUnique({ where: { id } });
    if (!current) return { error: 'Diagrama no encontrado' };
    if (current.company_id && current.company_id !== companyId) {
      return { error: 'No se puede editar un diagrama de otra empresa' };
    }
    if (current.company_id === null) {
      return { error: 'No se puede editar un diagrama de catálogo del sistema' };
    }

    const duplicate = await prisma.work_diagram.findFirst({
      where: {
        id: { not: id },
        name: { equals: trimmed, mode: 'insensitive' },
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { id: true },
    });
    if (duplicate) return { error: 'Ya existe un diagrama con ese nombre' };

    await prisma.work_diagram.update({ where: { id }, data: { name: trimmed } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error updating work diagram:', error);
    return { error: String(error) };
  }
}

export async function toggleWorkDiagramParameterActive(id: string, isActive: boolean) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  try {
    const current = await prisma.work_diagram.findUnique({ where: { id } });
    if (!current) return { error: 'Diagrama no encontrado' };
    if (current.company_id && current.company_id !== companyId) {
      return { error: 'No se puede modificar un diagrama de otra empresa' };
    }
    if (current.company_id === null) {
      return { error: 'No se puede modificar un diagrama de catálogo del sistema' };
    }

    await prisma.work_diagram.update({ where: { id }, data: { is_active: isActive } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error toggling work diagram:', error);
    return { error: String(error) };
  }
}

// ============================================================
// Type of Contract (read-only, enum del sistema — Fase 2 lo convierte en tabla)
// ============================================================

export async function getTypeOfContractValues() {
  // Hardcoded del enum type_of_contract_enum
  return [
    { id: 'Periodo_de_prueba', name: 'Período de prueba', is_active: true },
    { id: 'A_tiempo_indeterminado', name: 'A tiempo indeterminado', is_active: true },
    { id: 'Plazo_fijo', name: 'Plazo fijo', is_active: true },
  ];
}
