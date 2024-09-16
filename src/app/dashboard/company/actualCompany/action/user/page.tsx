import BackButton from '@/components/BackButton';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function page() {
  const user = {
    picture: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80',
    lastname: 'Doe',
    firstname: 'John',
    is_active: true,
  };

  const permisosEmpleados: string[] = [
    'Modulo Empleados',
    'Editar Empleados',
    'Cargar Documentos',
    'Visualizar Documentos',
    'Crear tipos de documentos',
    'Crear tipos de diagramas',
    'Carga de Diagramas',
    'Ver Diagramas',
  ];

  return (
    <section className="grid grid-cols-1 xl:grid-cols-8 gap-3 md:mx-7 py-4">
      <Card className={cn('col-span-8 flex flex-col justify-between overflow-hidden')}>
        <CardHeader className="min-h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
          <div className="flex gap-3 items-center">
            <CardTitle className=" font-bold tracking-tight">
              <Avatar className="size-[100px] rounded-full border-2 border-black/30">
                <AvatarImage
                  className="object-cover rounded-full"
                  src={user?.picture || 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'}
                  alt="Imagen del empleado"
                />
              </Avatar>
            </CardTitle>
            <CardDescription className="text-muted-foreground text-3xl flex items-center gap-4">
              {`${user?.lastname || 'cargando...'}
                ${user?.firstname || ''}`}{' '}
              {!user?.is_active && <Badge variant={'destructive'}>Dado de baja</Badge>}
            </CardDescription>
          </div>
          <div className="flex flex-grap gap-2">
            <Button variant="default">Habilitar edición</Button>
            <BackButton />
          </div>
        </CardHeader>
        <div>información del usuario</div>
        <Card>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex - flex-col gap-2">
              <h3 className="text-lg font-semibold">Permisos de usuario</h3>
              <div className="grid grid-cols-5 w-full items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Administrador de empleados
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Usuario de empleados
                    </label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Administrador de Equipos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Administrador de documentos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Administrador de Mantenimiento
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Administrador de Operaciones
                  </label>
                </div>
              </div>
            </div>
            <div className="flex - flex-col gap-2">
              <h3 className="text-lg font-semibold">Permisos Inidividuales</h3>
              <div className="grid grid-cols-5 w-full items-center">
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-semibold">Módulo Empleados</h3>
                  {permisosEmpleados.map((permiso, index) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox id={permiso} />
                      <label
                        htmlFor={permiso}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permiso}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-semibold">Módulo Equipos</h3>
                  {permisosEmpleados.map((permiso, index) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox id={permiso} />
                      <label
                        htmlFor={permiso}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permiso}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-semibold">Módulo Documentos</h3>
                  {permisosEmpleados.map((permiso, index) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox id={permiso} />
                      <label
                        htmlFor={permiso}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permiso}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-semibold">Módulo Mantenimiento</h3>
                  {permisosEmpleados.map((permiso, index) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox id={permiso} />
                      <label
                        htmlFor={permiso}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permiso}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-semibold">Módulo Operaciones</h3>
                  {permisosEmpleados.map((permiso, index) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox id={permiso} />
                      <label
                        htmlFor={permiso}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permiso}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  );
}

export default page;
