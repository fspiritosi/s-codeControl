'use client';
import { useState } from 'react';
import { storage, type StorageBucket } from '@/shared/lib/storage';
import { useEdgeFunctions } from './useEdgeFunctions';

export const useImageUpload = () => {
  const [loading, setLoading] = useState(false);
  const { errorTranslate } = useEdgeFunctions();
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;

  const uploadImage = async (file: File, imageBucket: string): Promise<string> => {
    try {
      setLoading(true);

      const data = await storage.upload(
        imageBucket as StorageBucket,
        `${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
        file,
        {
          cacheControl: '1',
          upsert: true,
        }
      );

      // Obtener la URL de la imagen cargada
      const imageUrl = `${url}/${imageBucket}/${(data as any)?.path || file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`
        .trim()
        .replace(/\s/g, '');

      return imageUrl;
    } catch (error: any) {
      const message = await errorTranslate(error?.message || String(error));
      throw new Error(String(message).replaceAll('"', ''));
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading };
};
