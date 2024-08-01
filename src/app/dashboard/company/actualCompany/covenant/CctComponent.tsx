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
import { columnsCategory } from './columnsCategory'
import { DataCategory } from './data-table-category';
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
  
  const contractorCompanies = useCountriesStore((state) =>
    state.contacts?.filter((company: any) => company.company_id.toString() === actualCompany?.id)
  );
  const [guild, setGuild] = useState<any>({
    guild: [],
  });
  const [data, setData] = useState<any>({
    covenants: [],

  });
  const [category, setCategory] = useState<any>({

    category: [],
  });

  const fetchGuild = async () => {

    let { data: guild } = await supabase
      .from('guild')
      .select('*')
      .eq('company_id', actualCompany?.id)
      .select()


    setGuild({
      ...guild,

      guild: (guild || [])?.map((e) => {
        return { name: e.name as string, id: e.id as string, is_active: e.is_active };
      }),

    });
  };

  const fetchCovenant = async () => {

    let { data: covenants } = await supabase
      .from('covenant')
      .select('*, guild_id(name)')
      .eq('company_id', actualCompany?.id)

    setData({
      ...data,

      covenants: (covenants || [])?.map((e) => {
        return { name: e.name as string, id: e.id as string, number: e.number as string, guild_id: e.guild_id?.name ?? '', is_active: e.is_active };
      }),

    });
    console.log(data);
  };
  const fetchCategory = async () => {

    let { data: category } = await supabase
      .from('category')
      .select('*, covenant_id(name,guild_id(name))')
    // .eq('company_id', actualCompany?.id)

    setCategory({
      ...category,

      category: (category || [])?.map((e) => {
        return { name: e.name as string, id: e.id as string, number: e.number as string, covenant_id: e.covenant_id.name as string, guild_id: e.covenant_id.guild_id.name as string, is_active: e.is_active };
      }),

    });
  };

  useEffect(() => {
    fetchGuild();
    fetchCovenant();
    fetchCategory();

  }, [actualCompany?.id]);



  
  const channels = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild' }, (payload) => {
      // console.log('Change received!', payload);
      fetchGuild();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'covenant' }, (payload) => {
      // console.log('Change received!', payload);
      fetchCovenant();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'category' }, (payload) => {
      // console.log('Change received!', payload);
      fetchCategory();
    })
    .subscribe();

  return (
          <div>
              <Tabs defaultValue="guild" className="w-full">
                <TabsList className="ml-4 mt-4">
                  <TabsTrigger value="guild">Sindicatos</TabsTrigger>
                  <TabsTrigger value="covenant">Convenios</TabsTrigger>
                  <TabsTrigger value="category">Categorias</TabsTrigger>
                </TabsList>
                <TabsContent value="covenant">
                  <div className="p-8">
                    <DataCct
                      columns={columns}
                      data={data.covenants || []}
                      localStorageName="covenantColums"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="guild">
                  <div className="p-8">
                    <DataGuild
                      columns={columnsGuild}
                      data={guild.guild || []}
                      localStorageName="guildColums"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="category">
                  <DataCategory
                    columns={columnsCategory}
                    data={category.category || []}
                    localStorageName="categoryColums"
                  />
                </TabsContent>
              </Tabs>
          </div>
         
  );
}