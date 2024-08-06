import { supabaseServer } from "@/lib/supabase/server";
import { setEmployeesToShow } from "@/lib/utils/utils";
import { cookies } from "next/headers";
import { DiagramForm } from "./DiagramForm";
import DiagramEmployeeView from "./DiagramEmployeeView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DiagramNewTypeForm } from "./DiagramNewTypeForm";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import DiagramTypeComponent from "./DiagramTypeComponent";

async function EmployesDiagram() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { data } = await fetch(`${URL}/api/employees?actual=${company_id}&user=${user?.id}`).then((e) => e.json());
  const activeEmploees = setEmployeesToShow(data?.filter((e: any) => e.is_active));
  const  {data: diagrams}  = await fetch(`${URL}/api/employees/diagrams`).then((e) => e.json());
  const {data: diagrams_types} = await fetch(`${URL}/api/employees/diagrams/tipos?actual=${company_id}&user=${user?.id}`).then((e) => e.json());


  return (
    <Tabs defaultValue="old">
      <TabsList >
        <TabsTrigger value="old">Diagrama Cargados</TabsTrigger>
        <TabsTrigger value="new">Cargar Diagrama</TabsTrigger>
        <TabsTrigger value="newsTypes">Tipos de Novedades</TabsTrigger>
      </TabsList>
      <TabsContent value="old">
        <DiagramEmployeeView diagrams={diagrams} activeEmployees={activeEmploees}/>
      </TabsContent>
      <TabsContent value="new">
        <DiagramForm activeEmploees={activeEmploees} diagrams={diagrams} diagrams_types={diagrams_types}/>
      </TabsContent>
      <TabsContent value="newsTypes">
        <DiagramTypeComponent diagrams_types={diagrams_types}/>
        
      </TabsContent>
    </Tabs>
    
  )
}

export default EmployesDiagram


/*TODO
  1 - Crear el formalario para la creación de novedades 👌 
  
  2 - Crear vista de para la creación de novedades 👌 
  
  3 - Finalizar la vista de diagrama del mes 👌 
  
  4 - Crear vista de diagrama de la persona en el perfil de la persona.
  
  5 - Tipos de diagramas debe ser editable para cada company 👌 
  
  6 - En las novedades agregar "Descripción Corta" - "Seleccionar Color" - 👌 
        6.1 - Se agrearon las columnas "short_description" y "color" en la tabla diagram_type 👌  
        6.2 - Recordar cambiar la columna de short_description a no null 👌 
        6.3 - Agregar estos campos en el Formulario 👌 
  
  7 - El color y la descripción corta es lo que vamos a usar para mostrar el diagrama.👌 
  
  8 - Crear filtro de empleados en la tabla de diagramas cargados, recordar que este filtro tiene que permitir elegir mas de un empleado a la vez.
  
  9 - Selector de fechas de la tabla diagramas cargados (30 días maximo)
        9.1 - Setear por defecto el día de la fecha y +30
  
  10 - Decidir si traer todos o los empleados o ninguno al montar el componente.
  
  11 - Permitir la edición de los tipos de novedad de diagrama.

  12 - Antes de guardar un nuevo diagrama de personal, debe chequear que no tenga uno creado.
        12.1 - Si existe un diagrama creado en la alguna de las fechas, informar al usuario que ese diagrama no pudo ser creado, si crear el resto. 
        12.2 - La manera de modificar uno o mas diagramas que ya se encuentren creados es modificando los mismos. (Acá podemos manejar multiples cosas como permisos, autorizaciones pendientes).
        12.3 - Teniendo en cuenta esta lógica, las opciones son las siguientes
                1° - Cambiar la forma en que se guardan los registros en la base de datos, para guardar un registro por cada día, esto hace mas sensilla la tarea de modificar un registro, también sería mas facil mostrarlos. CONTRA: Espacio en la DB
                2° - Mantener la manera en como se guardan los datos, al momento de crear uno nuevo, debo verificar los registros, controlar entre fechas, en caso de encontrar un entre fechas, tengo que editar el registro existente en la DB justo el día anterior al nuevo registro, guardar todos los registros siguiente, del que corté y continuarlos en caso de corresponder luego de finalizado el registro actual.  

                
  20 - Hacer el suscribe de todas las tablas

*/ 