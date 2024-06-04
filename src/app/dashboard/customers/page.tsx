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
import { supabase } from '../../../../supabase/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import{useState, useEffect} from "react"
import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function Customers() {
   //const actualCompany = cookies().get('actualComp')
   //const supabase = supabaseServer()
   const [customers, setCustomers] = useState([''])
   const allCompany = useLoggedUserStore(state => state.allCompanies)
   const [showInactive, setShowInactive] = useState(false)
   const useSearch = useSearchParams()
   useEffect(() => {
    const fetchCustomers = async () => {
      const { data , error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
      
      if (error) {
        console.error('Error fetching customers:', error)
      } else {
        setCustomers(data)
      }
    }

    fetchCustomers()
  }, [])

  return (
    <div>
      <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        
        <CardTitle className="text-[2vw]">Bienvenido a Clientes</CardTitle>
      </section>
      <section className="md:mx-7 grid grid-cols-1 mt-6 xl:grid-cols-2 gap-3 mb-4">
        <Card className="col-span-2 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
              <div className="grid gap-1">
                <CardTitle className="flex items-center text-lg ">
                  Clientes
                </CardTitle>
                <CardDescription className="capitalize">
                  Todos tus Clientes
                </CardDescription>
              </div>
              <Link
            href="/dashboard/customers/action?action=new"
            className={[
              'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
              buttonVariants({ variant: 'outline', size: 'lg' }),
            ].join(' ')}
          >
            Agregar nuevo cliente
          </Link>
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
