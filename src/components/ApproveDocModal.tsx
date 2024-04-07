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
import { toast, useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { supabase } from '../../supabase/supabase'
import { useRouter } from 'next/navigation'

export default function ApproveDocModal({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const handleApprove = async () => {
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

    router.push('/auditor')
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
