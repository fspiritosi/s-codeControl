'use client'
import React, { ChangeEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useImageUpload } from '@/hooks/useUploadImage'

interface UploadImageProps {
  onImageChange: (imageUrl: string) => void
  onUploadSuccess: (imageUrl: string) => void
}

export function UploadImage({
  onImageChange,
  onUploadSuccess,
}: UploadImageProps) {
  const { uploadImage, loading } = useImageUpload()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [base64Image, setBase64Image] = useState<string>('')

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)

      // Convertir la imagen a base64
      const reader = new FileReader()
      reader.onload = e => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (imageFile) {
      try {
        // Subir la imagen a Supabase Storage y obtener la URL
        const uploadedImageUrl = await uploadImage(imageFile)

        // Llamar a la función de cambio de imagen con la URL
        onImageChange(uploadedImageUrl)

        // Llamar a la función de éxito de carga con la URL
        onUploadSuccess(uploadedImageUrl)
      } catch (error) {
        console.error('Error al subir la imagen:', error)
      }
    }
  }

  return (
    <div>
      <label htmlFor="fileInput">Seleccionar imagen:</label>
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        id="fileInput"
      />

      {base64Image && (
        <img
          src={base64Image}
          alt="Vista previa de la imagen"
          style={{ maxWidth: '100%', marginTop: '10px' }}
        />
      )}
      {loading}
      {imageFile && (
        <Button onClick={handleUpload} disabled={loading}>
          Confirmar y Subir
        </Button>
      )}
    </div>
  )
}
