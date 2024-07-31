import { supabaseServer } from "@/lib/supabase/server";
import { setEmployeesToShow } from "@/lib/utils/utils";
import { cookies } from "next/headers";
import { DiagramForm } from "./DiagramForm";
import DiagramEmployeeView from "./DiagramEmployeeView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";



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
      </TabsList>
      <TabsContent value="new">
        <DiagramForm activeEmploees={activeEmploees} diagrams_types={diagrams_types}/>
      </TabsContent>
      <TabsContent value="old">
        <DiagramEmployeeView diagrams={diagrams}/>
      </TabsContent>
    </Tabs>
    
  )
}

export default EmployesDiagram