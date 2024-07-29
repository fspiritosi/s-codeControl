'use client'
import React from 'react'
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';    

interface Company {
    companyId: string;
}

export default function EditCompanyButton(companyId: Company) {
    const router = useRouter();
    const handleEditCompany = () => {
        router.push(`/dashboard/company/${companyId?.companyId}`);
    };
    return (
        <Button className="w-fit" onClick={handleEditCompany}>
            Editar Compañía
        </Button>
    )
}

