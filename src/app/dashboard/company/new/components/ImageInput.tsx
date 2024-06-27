'use client';
import { CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangeEvent, useRef, useState } from 'react';
// import { FormDescription, FormLabel } from './ui/form'

interface UploadImageProps {}

export function ImageInput({}: UploadImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | undefined>();
  const [required, setRequired] = useState(false);
  const disabled = false;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
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

  return (
    <div>
      <div className="flex flex-col  space-y-2">
        <Label htmlFor="fileInput">
          Subir Logo <span className="opacity-70">(10MB máximo)</span>
          {required ? <span style={{ color: 'red' }}> *</span> : ''}
        </Label>
        <Input
          disabled={disabled}
          readOnly
          type="text"
          accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
          onClick={() => fileInputRef?.current?.click()} // Abre el diálogo de selección de archivos
          className="self-center cursor-pointer"
          placeholder={'Seleccionar foto o subir foto'}
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
          placeholder="Seleccionar foto o subir foto"
        />
        <CardDescription className="max-w-[300px] p-0 m-0"></CardDescription>
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
    </div>
  );
}
