'use client'
import { Input } from '@/components/ui/input'
import React, { ChangeEvent } from 'react'
import { Button } from './ui/button'
import { FormDescription, FormLabel } from './ui/form'

interface UploadImageProps {
  inputStyle?: React.CSSProperties
  desciption?: string
  labelInput?: string
  handleImageChange?: (event: ChangeEvent<HTMLInputElement>) => void //nueva
  base64Image: string //nueva
}

export function ImageHander({
  inputStyle,
  desciption,
  labelInput,
  handleImageChange,
  base64Image,
}: UploadImageProps) {

  return (
    <>
      <div className="flex flex-col  space-y-2">
        <FormLabel>{labelInput}</FormLabel>
        <Input
          type="file"
          accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            handleImageChange && handleImageChange(event) // Accede al archivo file del input
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
