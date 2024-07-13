'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from "../../../../../../supabase/supabase"
import { columns } from './columnsCct';
import { columnsGuild } from './columnsGuild';
import { DataCct } from './data-table-cct';
import { DataGuild } from './data-table-guild';
import { CovenantRegister } from "@/components/CovenantRegister";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Cct() {
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const router = useRouter();
  const [contacts, setContacts] = useState(['']);
  const allCompany = useLoggedUserStore((state) => state.allCompanies);
  const [showInactive, setShowInactive] = useState(false);
  const useSearch = useSearchParams();
  const fetchContacts = useCountriesStore((state) => state.fetchContacts);
  // const subscribeToContactsChanges = useCountriesStore((state) => state.subscribeToContactsChanges);
  const contractorCompanies = useCountriesStore((state) =>
    state.contacts?.filter((company: any) => company.company_id.toString() === actualCompany?.id)
  );
  const [guild, setGuild] = useState<any>({
    guild: [],
  });
  const [data, setData] = useState<any>({
    covenants: [],
  });

  const fetchGuild = async () => {

    let { data: guild } = await supabase
      .from('guild')
      .select('*')
      .eq('company_id', actualCompany?.id)
      .select()
    console.log(guild)
    // let { data: type, error } = await supabase.from('type').select('*');
    setGuild({
      ...guild,

      guild: (guild || [])?.map((e) => {
        return { name: e.name as string, id: e.id as string, is_active: e.is_active };
      }),

    });
  };
  console.log("guild: ", guild)
  const fetchCovenant = async () => {

    let { data: covenants } = await supabase
      .from('covenant')
      .select('*, guild_id(name)')
      .eq('company_id', actualCompany?.id)

    console.log(covenants)

    setData({
      ...data,

      covenants: (covenants || [])?.map((e) => {
        return { name: e.name as string, id: e.id as string, number: e.number as string, guild_id: e.guild_id.name as string, is_active: e.is_active };
      }),

    });
  };
  console.log(data)
  useEffect(() => {
    fetchGuild();
    fetchCovenant();

    // const unsubscribe = subscribeToContactsChanges();

    // return () => {
    //   unsubscribe();
    // };
  }, []);
  // console.log(data)
  const channels = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'covenant' }, (payload) => {
      fetchCovenant();
    })
    .subscribe();

  const channels1 = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild' }, (payload) => {
      fetchGuild();
    })
    .subscribe();


  const handleCreateContact = () => {
    router.push(`/dashboard/company/covenant/action?action=new`);
  };
  // console.log(data)
  return (
    <div>
      {/* <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        
        <CardTitle className="text-[2vw]">Bienvenido a Clientes</CardTitle>
      </section> */}
      <section className="grid grid-cols-1  xl:grid-cols-2 gap-3 mb-4">
        <Card className="col-span-3 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="w-full bg-muted dark:bg-muted/50 border-b-2">

              <CardTitle className="text-2xl font-bold tracking-tight flex justify-between">
                Convenios
                <CovenantRegister />
              </CardTitle>
              {/* <CardDescription className="text-muted-foreground">Todos tus Convenios</CardDescription> */}
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="guild" className="w-full">
                <TabsList className="ml-4 mt-4">
                  <TabsTrigger value="guild">Sindicatos</TabsTrigger>
                  <TabsTrigger value="covenant">Convenios</TabsTrigger>
                </TabsList>
                <TabsContent value="covenant">
                  <div className="p-8">
                    <DataCct
                      columns={columns}
                      data={data.covenants || []}
                      allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                      localStorageName="covenantColums"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="guild">
                  <div className="p-8">
                    <DataGuild
                      columns={columnsGuild}
                      data={guild.guild || []}
                      allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                      localStorageName="guildColums"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="password">Change your password here.</TabsContent>
              </Tabs>
            </CardContent>
          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
      </section>
    </div>
  );
}
