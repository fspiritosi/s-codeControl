import { fetchCurrentCompany } from "@/app/server/GET/actions";
// TODO: Phase 8 — migrate auth to NextAuth
import { supabaseServer } from "../supabase/server";
import { getActualRole } from "../utils";


export const getRole = async () => {
    const supabase = await supabaseServer();
    const currentCompany = await fetchCurrentCompany();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = await getActualRole(currentCompany[0]?.id as string, user?.id as string);

    return role;
}

