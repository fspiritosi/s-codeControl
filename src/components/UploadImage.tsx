'use client';
import { Input } from '@/components/ui/input';
import { useImageUpload } from '@/hooks/useUploadImage';
import { handleSupabaseError } from '@/lib/errorHandler';
import React, { ChangeEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { FormDescription, FormLabel } from './ui/form';
require('dotenv').config();
interface UploadImageProps {
  onImageChange: (imageUrl: string) => void;
  // onUploadSuccess?: (imageUrl: string) => void
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  label?: string;
  desciption?: string;
  labelInput?: string;
  imageBucket: string;
  field?: any;
  setAvailableToSubmit?: (value: boolean) => void;
  disabledInput?: boolean;
  companyId: string;
}

export function UploadImage({
  onImageChange,
  disabledInput,
  style,
  inputStyle,
  desciption,
  labelInput,
  imageBucket,
  setAvailableToSubmit,
  field,
  companyId,
}: UploadImageProps) {
  const { uploadImage, loading } = useImageUpload();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
  const [disabled, setDisabled] = useState<boolean>(false);
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImageFile(file);

      // Convertir la imagen a base64
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (imageFile) {
      try {
        const fileExtension = 'jpg';
        const renamedFile = new File([imageFile], `${companyId.replace(/\s/g, '')}.${fileExtension}`, {
          type: `image/${fileExtension}`,
        });

        const uploadedImageUrl = await uploadImage(renamedFile, imageBucket);

        const companyImage = `${url}/${imageBucket}/${companyId.replace(
          /\s/g,
          ''
        )}.${fileExtension}?timestamp=${Date.now()}`.replace(/\s/g, '');
        // Llamar a la función de cambio de imagen con la URL
        onImageChange(companyImage);

        // Llamar a la función de éxito de carga con la URL
        // onUploadSuccess(uploadedImageUrl)
        if (setAvailableToSubmit) setAvailableToSubmit(true);
        setDisabled(true);
      } catch (error: any) {
        toast.error(`${handleSupabaseError(error.message)}`);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col  space-y-2">
        <FormLabel>{labelInput}</FormLabel>
        <Input
          type="file"
          disabled={disabledInput}
          accept="image/*"
          // {...field}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            if (field) {
              // field?.onChange(event) // Mantén el funcionamiento del {...field}
              handleImageChange(event); // Accede al archivo file del input
            } else {
              handleImageChange(event); // Accede al archivo file del input
            }
          }}
          className="self-center"
          id="fileInput"
          style={{ ...inputStyle }}
        />
        {desciption && <FormDescription className="max-w-[300px] p-0 m-0">{desciption}</FormDescription>}
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

        {loading}
        {imageFile && (
          <Button onClick={handleUpload} disabled={loading || disabled}>
            {disabled ? 'Imagen subida' : 'Subir imagen'}
          </Button>
        )}
      </div>
    </>
  );
}
