'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '../../supabase/supabase'

export default function ApproveDocModal({
  id,
  resource,
}: {
  id: string
  resource: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const handleApprove = async () => {
    if (resource === 'employee') {
      const { data, error } = await supabase
        .from('documents_employees')
        .update({ state: 'aprobado' })
        .eq('id', id)
        .select()

      if (error) {
        return toast({
          title: 'Error',
          description: 'Ocurrio un error al aprobar el documento',
          variant: 'destructive',
        })
      }

      toast({
        title: 'Documento aprobado',
        description: 'El documento ha sido aprobado correctamente',
        variant: 'default',
      })
    } else {
      const { data, error } = await supabase
        .from('documents_equipment')
        .update({ state: 'aprobado' })
        .eq('id', id)
        .select()

      if (error) {
        return toast({
          title: 'Error',
          description: 'Ocurrio un error al aprobar el documento',
          variant: 'destructive',
        })
      }

      toast({
        title: 'Documento aprobado',
        description: 'El documento ha sido aprobado correctamente',
        variant: 'default',
      })
    }

    router.push('/admin/auditor')
  }
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button variant="success">Aprobar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Aprobar documento</DialogTitle>
          <DialogDescription>
            Estas seguro que deseas aprobar este documento? esta acción no se
            puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => handleApprove()}
            type="submit"
            variant="success"
          >
            Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
