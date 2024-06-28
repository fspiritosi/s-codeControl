'use client';
import { useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { useEdgeFunctions } from './useEdgeFunctions';
require('dotenv').config();

export const useImageUpload = () => {
  const [loading, setLoading] = useState(false);
  const { errorTranslate } = useEdgeFunctions();
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;

  const uploadImage = async (file: File, imageBucket: string): Promise<string> => {
    try {
      setLoading(true);

      // Subir la imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .upload(`${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, file, {
          //.upload('public/image.png', file, {
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
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading };
};
