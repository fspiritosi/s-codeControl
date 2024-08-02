import { supabaseServer } from "@/lib/supabase/server";
import { setEmployeesToShow } from "@/lib/utils/utils";
import { cookies } from "next/headers";
import { DiagramForm } from "./DiagramForm";
import DiagramEmployeeView from "./DiagramEmployeeView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DiagramNewTypeForm } from "./DiagramNewTypeForm";



async function EmployesDiagram() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { data } = await fetch(`${URL}/api/employees?actual=${company_id}&user=${user?.id}`).then((e) => e.json());
  //const { diagrams } = await fetch(`${URL}/api/employees/diagrams`).then((e) => e.json());
  const  {data: diagrams}  = await fetch(`${URL}/api/employees/diagrams`).then((e) => e.json());
  const {data: diagrams_types} = await fetch(`${URL}/api/employees/diagrams/tipos?actual=${company_id}&user=${user?.id}`).then((e) => e.json());
  const activeEmploees = setEmployeesToShow(data?.filter((e: any) => e.is_active));
  const myDiagrams = await diagrams
  // console.log(myDiagrams)
  // console.log(activeEmploees)

  return (
    <Tabs defaultValue="new">
      <TabsList >
        <TabsTrigger value="new">Cargar Diagrama</TabsTrigger>
        <TabsTrigger value="old">Diagrama Cargados</TabsTrigger>
        <TabsTrigger value="newsTypes">Tipos de Novedades</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <DiagramForm activeEmploees={activeEmploees} diagrams_types={diagrams_types}/>
      </TabsContent>
      <TabsContent value="old">
        <DiagramEmployeeView diagrams={diagrams}/>
      </TabsContent>
      <TabsContent value="newsTypes">
       <DiagramNewTypeForm />
      </TabsContent>
    </Tabs>
    
  )
}

export default EmployesDiagram


/*TODO
  1 - Crear el formalario para la creación de novedades 👌 
  2 - Crear vista de para la creación de novedades 👌 
  3 - Finalizar la vista de diagrama del mes
  4 - Crear vista de diagrama de la persona en el perfil de la persona.
  5 - Tipos de diagramas debe ser editable para cada company
  6 - En las novedades agregar "Descripción Corta" - "Seleccionar Color" - 👌 
      6.1 - Se agrearon las columnas "short_description" y "color" en la tabla diagram_type 👌  
      6.2 - Recordar cambiar la columna de short_description a no null
      6.3 - Agregar estos campos en el Formulario 👌 
  7 - El color y la descripción corta es lo que vamos a usar para mostrar el diagrama.

*/ 