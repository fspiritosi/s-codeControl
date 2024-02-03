'use client'
import { Input } from '@/components/ui/input'
import React, { ChangeEvent } from 'react'
import { Button } from './ui/button'
import { FormDescription, FormLabel } from './ui/form'

interface UploadImageProps {
  onImageChange?: (imageUrl: string) => void
  // onUploadSuccess?: (imageUrl: string) => void
  style?: React.CSSProperties
  inputStyle?: React.CSSProperties
  label?: string
  desciption?: string
  labelInput?: string
  imageBucket: string
  field?: any
  setAvailableToSubmit?: (value: boolean) => void
  disabledInput?: boolean
  handleUpload?: () => void //nueva
  handleImageChange?: (event: ChangeEvent<HTMLInputElement>) => void //nueva
  base64Image: string //nueva
  imageFile: File | null //nueva
  loading: boolean
}

export function ImageHander({
  onImageChange,
  // onUploadSuccess,
  disabledInput,
  style,
  inputStyle,
  desciption,
  labelInput,
  imageBucket,
  setAvailableToSubmit,
  field,
  handleUpload,
  handleImageChange,
  base64Image,
  loading,
  imageFile,
}: UploadImageProps) {
  // const { uploadImage, loading } = useImageUpload()
  // const [imageFile, setImageFile] = useState<File | null>(null)
  // const [base64Image, setBase64Image] = useState<string>('')
  // const [disabled, setDisabled] = useState<boolean>(false)
  // const { toast } = useToast()

  // const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0]

  //   if (file) {
  //     setImageFile(file)

  //     // Convertir la imagen a base64
  //     const reader = new FileReader()
  //     reader.onload = e => {
  //       if (e.target && typeof e.target.result === 'string') {
  //         setBase64Image(e.target.result)
  //       }
  //     }
  //     reader.readAsDataURL(file)
  //   }
  // }

  // const handleUpload = async () => {
  //   if (imageFile) {
  //     try {
  //       // Subir la imagen a Supabase Storage y obtener la URL
  //       const uploadedImageUrl = await uploadImage(imageFile, imageBucket)

  //       // Llamar a la función de cambio de imagen con la URL si está definida
  //       if (onImageChange) {
  //         onImageChange(uploadedImageUrl)
  //       }

  //       // Llamar a la función de éxito de carga con la URL
  //       // onUploadSuccess(uploadedImageUrl)
  //       if (setAvailableToSubmit) setAvailableToSubmit(true)
  //       setDisabled(true)
  //     } catch (error: any) {
  //       toast({
  //         variant: 'destructive',
  //         title: error.message,
  //       })
  //     }
  //   }
  // }

  return (
    <>
      <div className="flex flex-col  space-y-2">
        <FormLabel>{labelInput}</FormLabel>
        <Input
          type="file"
          accept="image/*"
          // {...field}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            if (field) {
              // field?.onChange(event) // Mantén el funcionamiento del {...field}
              handleImageChange && handleImageChange(event) // Accede al archivo file del input
            } else {
              handleImageChange && handleImageChange(event) // Accede al archivo file del input
            }
          }}
          className="self-center"
          id="fileInput"
          style={{ ...inputStyle }}
        />
        {desciption && (
          <FormDescription className="max-w-[300px] p-0 m-0">
            {desciption}
          </FormDescription>
        )}
      </div>

      <div className="flex items-center gap-2 justify-around  rounded-xl">
        {base64Image && (
          <img
            src={base64Image}
            // style={{ ...style }}
            className="rounded-xl my-1 max-w-[150px] max-h-[120px] p-2 bg-slate-200"
            alt="Vista previa de la imagen"
          />
        )}
      
      </div>
    </>
  )
}
