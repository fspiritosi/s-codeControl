'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useImageUpload } from '@/hooks/useUploadImage'
import React, { ChangeEvent, useState } from 'react'
import { FormDescription, FormLabel } from './ui/form'

interface UploadImageProps {
  onImageChange: (imageUrl: string) => void
  onUploadSuccess: (imageUrl: string) => void
  style?: React.CSSProperties
  inputStyle?: React.CSSProperties
  label?: string
  desciption?: string
  labelInput?: string
}

export function UploadImage({
  onImageChange,
  onUploadSuccess,
  style,
  inputStyle,
  label,
  desciption,
  labelInput,
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
    <>
      <div className="flex flex-col  space-y-2">
        <FormLabel>{labelInput}</FormLabel>
        <Input
          type="file"
          accept="image/*"
          className="self-center"
          onChange={handleImageChange}
          id="fileInput"
          style={{ ...inputStyle }}
        />
        {desciption && (
          <FormDescription className="max-w-[300px] p-0 m-0">
            {desciption}
          </FormDescription>
        )}
      </div>

      <div className="flex items-center w-[300px] justify-around bg-slate-200 rounded-xl">
        {base64Image && (
          <img
            src={base64Image}
            className="rounded-xl my-1"
            alt="Vista previa de la imagen"
            style={{ maxWidth: '100%', ...style }}
          />
        )}
        {loading}
        {imageFile && (
          <Button onClick={handleUpload} disabled={loading}>
            Confirmar y Subir
          </Button>
        )}
      </div>
    </>
  )
}
