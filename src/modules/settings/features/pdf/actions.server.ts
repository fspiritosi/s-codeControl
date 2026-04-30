'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { storageServer } from '@/shared/lib/storage-server';
import { revalidatePath } from 'next/cache';

/**
 * Claves estables de los PDFs que se pueden firmar.
 * Cuando agreguemos un nuevo template firmable, sumar la clave acá.
 */
export const SIGNABLE_PDF_KEYS = [
  { key: 'purchase-order', label: 'Órdenes de compra' },
  { key: 'withdrawal-order', label: 'Retiros de mercadería' },
] as const;

export type SignablePdfKey = (typeof SIGNABLE_PDF_KEYS)[number]['key'];

export interface PdfSettingsData {
  header_text: string | null;
  footer_text: string | null;
  signature_image_url: string | null;
  signed_pdf_keys: string[];
}

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
 * Sube la imagen de firma a storage y devuelve la URL pública.
 * Reusa el bucket `logo` con prefijo `pdf-signatures/{company_id}.{ext}`.
 */
export async function uploadSignatureImage(formData: FormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected', url: null };

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'Falta el archivo', url: null };

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `pdf-signatures/${companyId}.${ext}`;

    await storageServer.upload('logo', path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${ext}`,
    });

    const url = await storageServer.getPublicUrl('logo', path);

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
    console.error('Error uploading signature:', error);
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
