'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '../../supabase/supabase'
import { Input } from './ui/input'

export default function UpdateDocuments({
  documentName,
  resource,
  id,
}: {
  documentName: string | null
  resource: string | null
  id: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const FormSchema = z.object({
    new_document: z.string({ required_error: 'El documento es requerido' }),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)

  async function onSubmit(filename: z.infer<typeof FormSchema>) {
    if (!file) {
      form.setError('new_document', {
        type: 'manual',
        message: 'El documento es requerido',
      })
      return
    }
    const fileExtension1 = file.name.split('.').pop()
    const fileExtension2 = documentName?.split('.').pop()
    const tableName =
      resource === 'vehicle' ? 'documents_equipment' : 'documents_employees'

    if (fileExtension1 !== fileExtension2) {
      // const pathDelete = resource === 'vehicle' ? `documentos-equipos/${documentName}.${fileExtension2}` : `documentos-empleados/${documentName}.${fileExtension2}`
      if (!documentName) return
      const { error: storageError } = await supabase.storage
        .from('document_files')
        .remove([documentName])
    }
    const documentNameWithOutExtension = documentName?.split('.').shift()

    const { error: storageError } = await supabase.storage
      .from('document_files')
      .upload(`/${documentNameWithOutExtension}.${fileExtension1}`, file, {
        cacheControl: '0',
        upsert: true,
      })

    const { error: updateError } = await supabase
      .from(tableName)
      .update({ state: 'presentado', deny_reason: null })
      .match({ id })

    if (storageError) {
      toast({
        title: 'Error',
        description: 'Hubo un error al subir el documento',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Documento actualizado',
      description: 'El documento se ha actualizado correctamente',
      variant: 'default',
    })

    router.push('/dashboard')
    setIsOpen(false)
  }
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button>Actualizar documento</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Reemplazar documento</DialogTitle>
        </DialogHeader>
        <div className="grid w-full gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
              <div className="flex flex-col">
                <FormField
                  control={form.control}
                  name="new_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Documento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={e => {
                            setFile(e.target.files?.[0] || null)
                            field.onChange(e)
                          }}
                          type="file"
                        />
                      </FormControl>
                      <FormDescription>
                        Este nuevo documento reemplazara el anterior, asegurate
                        de que sea el correcto.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="default"
                  className="self-end mt-5"
                >
                  Actualizar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
