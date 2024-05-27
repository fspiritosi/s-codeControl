import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { supabase } from "../../../../supabase/supabase"

export function CreateDialog() {


    async function createDiagram(formData:FormData) {
        'use server'

        const diagramFormData = {
            name: formData.get('name')
        }

        console.log(diagramFormData.name)
        
        const { data, error } = await supabase
        .from('work-diagram')
        .insert([
        { name: diagramFormData.name },
        ])
        .select()
        //TODO falta la notificación y que cierre el dialogo de manera automática
    }




  return (
    <Dialog>
      <DialogTrigger asChild>
      <Button size="sm" className="h-7 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Nuevo Diagrama
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Diagrama de Trabajo</DialogTitle>
          <DialogDescription>
            Crea un nuevo diagrama de trabajo
          </DialogDescription>
        </DialogHeader>
        <form action={createDiagram}>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                
                <Label htmlFor="name" className="text-right">
                Descripción
                </Label>
                <Input
                id="name"
                name="name"
                defaultValue="Lunes a Viernes"
                className="col-span-3"
                />
            </div>
            </div>
            <DialogFooter>
            <Button type="submit">Crear</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
