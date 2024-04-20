import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function ReportAnIssue() {
  return (
    <section className="md:mx-7 w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>
            Reportar un problema (Todavia no tiene funcionalidad)
          </CardTitle>
          <CardDescription>¿En qué área tienes problemas?</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex gap-2 flex-wrap">
            <div className=" gap-2">
              <Label htmlFor="area">Área</Label>
              <Select defaultValue="billing">
                <SelectTrigger id="area">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Equipo</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="account">Cuenta</SelectItem>
                  <SelectItem value="deployments">Implementaciones</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className=" gap-2">
              <Label htmlFor="security-level">Nivel de seguridad</Label>
              <Select defaultValue="2">
                <SelectTrigger
                  id="security-level"
                  className="line-clamp-1 w-[260px]"
                >
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Severidad 1 (Más alta)</SelectItem>
                  <SelectItem value="2">Severidad 2</SelectItem>
                  <SelectItem value="3">Severidad 3</SelectItem>
                  <SelectItem value="4">Severidad 4 (Más baja)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input id="subject" placeholder="Necesito ayuda con..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Por favor, incluye toda la información relevante sobre tu problema."
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between space-x-2">
          <Button variant="ghost">Cancelar</Button>
          <Button>Enviar</Button>
        </CardFooter>
      </Card>
    </section>
  )
}
