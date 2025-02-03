import { fetchCurrentCompany } from "@/app/server/GET/actions";
import { supabaseServer } from "../supabase/server";
import { getActualRole } from "../utils";


export const getRole = async () => {
    const supabase = supabaseServer();
    const currentCompany = await fetchCurrentCompany();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = await getActualRole(currentCompany[0]?.id as string, user?.id as string);

    return role;
}

