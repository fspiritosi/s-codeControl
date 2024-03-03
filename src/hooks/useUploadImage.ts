'use client'
import { useState } from 'react'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'

export const useImageUpload = () => {
  const [loading, setLoading] = useState(false)
  const { errorTranslate } = useEdgeFunctions()

  const uploadImage = async (
    file: File,
    imageBucket: string,
  ): Promise<string> => {
    try {
      setLoading(true)

      // Subir la imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .upload(`${file.name}`, file)

      if (error) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }

      // Obtener la URL de la imagen cargada
      const imageUrl = `https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/${imageBucket}/${data?.path}`

      return imageUrl
    } finally {
      setLoading(false)
    }
  }

  return { uploadImage, loading }
}
