"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';


import { useLoggedUserStore } from '@/store/loggedUser';
import { supabase } from '../../../supabase/supabase'



import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/app/dashboard/employee/data-table';
import { columns } from '@/app/dashboard/employee/columns'
import { DataEquipment } from '@/app/dashboard/equipment/data-equipment';
import { columns as columns1 } from "@/app/dashboard/equipment/columns";
import { cn } from '@/lib/utils';

export default async function Guests() {
    
    const [clientData, setClientData] = useState<any>(null);
    const [contactData, setContactData] = useState<any>(null);
    const employees = useLoggedUserStore(state => state.employeesToShow)
    const equipment = useLoggedUserStore(state => state.vehiclesToShow)
    const filteredCustomersEmployees = employees?.filter((customer: any) =>
                customer.allocated_to && customer.allocated_to.includes(clientData?.id)
            );
            const filteredCustomersEquipment = equipment?.filter((customer: any) =>
                customer.allocated_to && customer.allocated_to.includes(clientData?.id)
            );
            console.log(filteredCustomersEmployees)
            const setActivesEmployees = useLoggedUserStore(
                state => state.setActivesEmployees,
            )
            const setInactiveEmployees = useLoggedUserStore(
                state => state.setInactiveEmployees,
            )
            const showDeletedEmployees = useLoggedUserStore(
                state => state.showDeletedEmployees,
            )
            const setShowDeletedEmployees = useLoggedUserStore(
                state => state.setShowDeletedEmployees,
            )
            const allCompany = useLoggedUserStore(state => state.allCompanies)
            const [showInactive, setShowInactive] = useState(false)

    return (
        <div className=''>
            ESTO ES CLIENTES INVITADOS
            <DataTable
                                    columns={columns}
                                    data={filteredCustomersEmployees || []}
                                    setActivesEmployees={setActivesEmployees}
                                    setInactiveEmployees={setInactiveEmployees}
                                    showDeletedEmployees={showDeletedEmployees}
                                    setShowDeletedEmployees={setShowDeletedEmployees}
                                />
        </div>
    )
}
