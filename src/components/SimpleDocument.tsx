'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../supabase/supabase'
export default function SimpleDocument({ resource }: { resource: string }) {
  const [documenTypes, setDocumentTypes] = useState<any[] | null>([])
  const fetchDocumentTypes = async () => {
    const applies = resource === 'empleado' ? 'Persona' : 'Equipos'
    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('applies', applies)
      .eq('multiresource', false)

    setDocumentTypes(document_types)

    setFiles(() => {
      const fileObj: { name: string; file: any }[] = []
      document_types?.forEach(documentType => {
        const data = {
          name: documentType.name,
          file: '',
        }
        fileObj.push(data)
      })
      return fileObj
    })
  }

  useEffect(() => {
    fetchDocumentTypes()
  }, [])
  const [files, setFiles] = useState<{ name: string; file: any }[] | null>([])

  // console.log(files, 'files')

  const squemas = documenTypes?.reduce((acc, documentType) => {
    return {
      ...acc,
      [documentType.name]: z.string().optional(),
    }
  }, {})

  const formSchema = squemas ? z.object(squemas) : z.object({})
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const finalValues = files?.filter(file => file.file !== '')
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(finalValues)
  }

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Documento No multirecurso</AlertDialogTitle>
          <AlertDialogDescription>
            Sube los documentos que necesitas
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[60dvh] overflow-y-scroll">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {documenTypes?.map(documentType => {
                return (
                  <div key={documentType.id}>
                    <FormField
                      control={form.control}
                      name={documentType.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{documentType.name}</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              placeholder="Seleccionar documento"
                              {...field}
                              onChange={event => {
                                const file = event.target.files?.[0]
                                const name = field.name
                                setFiles(
                                  prev =>
                                    prev?.map(fileObj => {
                                      if (fileObj.name === name) {
                                        return { name, file }
                                      }
                                      return fileObj
                                    }) || null,
                                )
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            {documentType.description}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )
              })}
              <div className="flex justify-evenly">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button type="submit">Subir documentos</Button>
              </div>
            </form>
          </Form>
        </div>
        <AlertDialogFooter></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
