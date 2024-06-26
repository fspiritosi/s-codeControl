"use client"
import { MissingDocumentList } from '@/components/MissingDocumentList'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { columns } from './columns'
import { DataCustomers } from './data-table'
import { supabase } from '../../../../../supabase/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect } from "react"
import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'



export default function Customers() {
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const router = useRouter()
  const [customers, setCustomers] = useState([''])
  const allCompany = useLoggedUserStore(state => state.allCompanies)
  const [showInactive, setShowInactive] = useState(false)
  const useSearch = useSearchParams()

  const   fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', actualCompany?.id)
      
    if (error) {
      console.error('Error fetching customers:', error)
    } else {
      setCustomers(data)
      
    }
    
  }
  useEffect(() => {
    
    

    fetchCustomers()
  }, [])


const channels = supabase.channel('custom-all-channel')
.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'customers' },
  (payload) => {
    console.log('Change received!', payload)
    fetchCustomers()
    
  }
)
.subscribe()

  const handleCreateClient = () => {
    router.push(`/dashboard/company/customers/action?action=new`);
  };

  return (
    <div>
      {/* <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        
        <CardTitle className="text-[2vw]">Bienvenido a Clientes</CardTitle>
      </section> */}
      <section className="grid grid-cols-1  xl:grid-cols-2 gap-3 mb-4">
        <Card className="col-span-3 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="w-full bg-muted dark:bg-muted/50 border-b-2">
              {/* <div className="grid gap-1"> */}
              <CardTitle className="text-2xl font-bold tracking-tight flex justify-between">
                Clientes




                {/* </div> */}
                <Button
                  className="ml-auto flex justify-between mb-2"
                  onClick={handleCreateClient}
                >
                  Registrar Cliente
                </Button>
              </CardTitle >
              <CardDescription className="text-muted-foreground">
                Todos tus Clientes
              </CardDescription>
            </CardHeader>

            <CardContent>
              <DataCustomers
                columns={columns}
                data={customers || []}
                allCompany={allCompany}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
              />
            </CardContent>

          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>

      </section>
    </div>
  )
}

