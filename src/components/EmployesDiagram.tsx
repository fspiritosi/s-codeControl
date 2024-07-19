import { supabaseServer } from "@/lib/supabase/server";
import { setEmployeesToShow } from "@/lib/utils/utils";
import { cookies } from "next/headers";
import { DiagramForm } from "./DiagramForm";



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
  


  return (
    <>
        <DiagramForm activeEmploees={activeEmploees}/>
    </>
  )
}

export default EmployesDiagram