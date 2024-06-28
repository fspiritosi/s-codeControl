'use client';
import { Input } from '@/components/ui/input';
import React, { ChangeEvent, useRef, useState } from 'react';
import { FormDescription, FormLabel } from './ui/form';

interface UploadImageProps {
  inputStyle?: React.CSSProperties;
  desciption?: string;
  labelInput?: string;
  handleImageChange?: (event: ChangeEvent<HTMLInputElement>) => void; //nueva
  base64Image: string; //nueva
  disabled?: boolean;
  required?: boolean;
}

export function ImageHander({
  inputStyle,
  desciption,
  labelInput,
  handleImageChange,
  base64Image,
  disabled,
  required,
}: UploadImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | undefined>();

  return (
    <>
      <div className="flex flex-col  space-y-2">
        <FormLabel htmlFor="fileInput">
          {labelInput} <span className="opacity-70">(10MB máximo)</span>
          {required ? <span style={{ color: 'red' }}> *</span> : ''}
        </FormLabel>
        <Input
          disabled={disabled}
          readOnly
          type="text"
          accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
          onClick={() => fileInputRef?.current?.click()} // Abre el diálogo de selección de archivos
          className="self-center cursor-pointer"
          style={{ ...inputStyle }}
          placeholder={base64Image ? `${file?.name}` : 'Seleccionar foto o subir foto'}
        />
        <Input
          ref={fileInputRef}
          disabled={disabled}
          type="file"
          accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            handleImageChange && handleImageChange(event); // Accede al archivo file del input
            setFile(event.target.files?.[0]); // Guarda el archivo en el estado
          }}
          className="self-center hidden"
          id="fileInput"
          style={{ ...inputStyle }}
          placeholder="Seleccionar foto o subir foto"
        />
        {desciption && <FormDescription className="max-w-[300px] p-0 m-0">{desciption}</FormDescription>}
      </div>

      <div className="flex items-center gap-2 justify-around  rounded-xl">
        {base64Image && (
          <img
            src={base64Image}
            className="rounded-xl my-1 max-w-[150px] max-h-[120px] p-2 bg-slate-200"
            alt="Vista previa de la imagen"
          />
        )}
      </div>
    </>
  );
}
