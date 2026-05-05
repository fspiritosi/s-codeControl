'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { storageServer } from '@/shared/lib/storage-server';
import { revalidatePath } from 'next/cache';
import type { PdfSettingsData } from './types';

export async function getPdfSettings(): Promise<PdfSettingsData | null> {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const settings = await prisma.pdf_settings.findUnique({
    where: { company_id: companyId },
  });

  if (!settings) {
    return {
      header_text: null,
      footer_text: null,
      signature_image_url: null,
      signed_pdf_keys: [],
    };
  }

  return {
    header_text: settings.header_text,
    footer_text: settings.footer_text,
    signature_image_url: settings.signature_image_url,
    signed_pdf_keys: settings.signed_pdf_keys,
  };
}

export async function upsertPdfSettings(input: {
  header_text: string | null;
  footer_text: string | null;
  signed_pdf_keys: string[];
  signature_image_url?: string | null;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    await prisma.pdf_settings.upsert({
      where: { company_id: companyId },
      update: {
        header_text: input.header_text,
        footer_text: input.footer_text,
        signed_pdf_keys: input.signed_pdf_keys,
        ...(input.signature_image_url !== undefined
          ? { signature_image_url: input.signature_image_url }
          : {}),
      },
      create: {
        company_id: companyId,
        header_text: input.header_text,
        footer_text: input.footer_text,
        signed_pdf_keys: input.signed_pdf_keys,
        signature_image_url: input.signature_image_url ?? null,
      },
    });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error upserting pdf_settings:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Paso 1: calcula el path de la firma. El cliente sube directo a Supabase.
 * Reusa el bucket `logo` con prefijo `pdf-signatures/{company_id}.{ext}`.
 */
export async function prepareSignatureUpload(input: { fileName: string }) {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false as const, error: 'No company selected' };

  const ext = input.fileName.split('.').pop()?.toLowerCase() || 'png';
  const path = `pdf-signatures/${companyId}.${ext}`;
  return { ok: true as const, path, bucket: 'logo' as const };
}

/**
 * Paso 2: confirma el upload — actualiza pdf_settings con la URL pública.
 */
export async function confirmSignatureUpload(input: { path: string }) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected', url: null };

  try {
    const url = await storageServer.getPublicUrl('logo', input.path);

    await prisma.pdf_settings.upsert({
      where: { company_id: companyId },
      update: { signature_image_url: url },
      create: {
        company_id: companyId,
        signature_image_url: url,
      },
    });

    revalidatePath('/dashboard/settings');
    return { error: null, url };
  } catch (error) {
    console.error('Error confirming signature:', error);
    return { error: error instanceof Error ? error.message : String(error), url: null };
  }
}

export async function removeSignatureImage() {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    await prisma.pdf_settings.upsert({
      where: { company_id: companyId },
      update: { signature_image_url: null },
      create: { company_id: companyId, signature_image_url: null },
    });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error removing signature:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
