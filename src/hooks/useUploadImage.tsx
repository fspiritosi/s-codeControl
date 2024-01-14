'use client'
import { useState } from 'react'
import { supabase } from '@/supabase/supabase'

export const useImageUpload = () => {
  const [loading, setLoading] = useState(false)

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setLoading(true)

      // Subir la imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from('logo')
        .upload(`${file.name}`, file)

      if (error) {
        throw error
      }

      // Obtener la URL de la imagen cargada
      const imageUrl = `https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/${data?.path}`

      return imageUrl
    } finally {
      setLoading(false)
    }
  }

  return { uploadImage, loading }
}
