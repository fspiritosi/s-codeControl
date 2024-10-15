'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/lib/utils'
import { formatDate } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download, ArrowLeft } from 'lucide-react'
import cookies from 'js-cookie'
import UpdateDocuments from '../UpdateDocuments'
import UploadDocument from './UploadDocument'
import { custom } from 'zod'
import { serialize } from 'v8'
import { log } from 'console'

interface DocumentViewProps {
    documentUrl: string
    rowId: string
    customerName?: string
    companyName?: string
    serviceName?: string
    itemNames?: string
    companyData: {
        company_name: string
        company_logo: string
        company_cuit: string
        address: string
        city: { name: string }
        contact_phone: string
        contact_email: string
        industry: string

    }
}
export default function DocumentView({ documentUrl, companyData, rowId, customerName, companyName, serviceName, itemNames }: DocumentViewProps) {
    const [documentData, setDocumentData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const company_id = cookies.get('actualComp')
    // const supabase = createClientComponentClient()
    const URL = process.env.NEXT_PUBLIC_BASE_URL
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await fetch(`${URL}/api/company?actual=${company_id}`).then(res => res.json())
                setDocumentData(data)
                setIsLoading(false)
            } catch (error) {
                console.error('Error fetching document data:', error)
                setIsLoading(false)
            }
        }

        fetchData()
    }, [documentUrl])
    console.log(companyData)
    if (isLoading) {
        return <Skeleton className="w-full h-screen" />
    }

    console.log(documentUrl)
    const urlParts = documentUrl.split('/');
    const decodedParts = urlParts.map(decodeURIComponent);
    const [decodedCustomerName, decodedServiceName, itemName] = decodedParts.slice(-4, -1);
    console.log(decodedCustomerName, decodedServiceName)
    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 w-[95vw]">
            <Card className="w-[95vw] lg:w-2/5">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">{companyData.company_name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between mb-4">
                        {/* <Button variant="outline" className="flex items-center gap-2"> */}
                            <Button variant="outline" className="flex items-center gap-2" onClick={() => {
                                fetch(documentUrl)
                                    .then(response => response.blob())
                                    .then(blob => {
                                        const link = document.createElement('a');
                                        link.href = window.URL.createObjectURL(blob);
                                        link.download = documentUrl.split('/').pop() || 'default-filename';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    })
                                    .catch(error => console.error('Error downloading the document:', error));
                            }}>
                                <Download size={16} />
                                Descargar
                            </Button>
                            {/* Descargar */}
                        {/* </Button> */}
                        {/* <Button variant="outline" className="flex items-center gap-2">
                            <ArrowLeft size={16} />
                            Volver
                        </Button> */}
                    </div>

                    <Tabs defaultValue="empresa">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="empresa">Empresa</TabsTrigger>
                            {/* <TabsTrigger value="customer">Cliente</TabsTrigger> */}
                            <TabsTrigger value="actualizar">Actualizar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="empresa">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16">
                                        <AvatarImage src={companyData.company_logo} alt={documentData.employeeName} />
                                        <AvatarFallback>{companyData.company_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold">{companyData.company_name}</h3>

                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p><strong>CUIT:</strong> {companyData.company_cuit}</p>
                                    <p><strong>Dirección:</strong> {companyData.address}</p>
                                    <p><strong>Provincia:</strong> {companyData.city.name}</p>
                                    <p><strong>Teléfono de contacto:</strong> {companyData.contact_phone}</p>
                                    <p><strong>Email de contacto:</strong> {companyData.contact_email}</p>
                                    <p><strong>Industria:</strong> {companyData.industry}</p>
                                </div>
                            </div>
                        </TabsContent>
                        {/* <TabsContent value="customer">
                        <Card>
                            <span className="text-lg font-semibold">Aqui van datos de los servicios e items del cliente</span>
                        </Card>
                        </TabsContent>     */}
                        <TabsContent value="actualizar">
                            <Card>
                                <div className="p-3 text-center space-y-3">
                                    <CardDescription>
                                        Si el documento subido no es el correcto, puedes actualizarlo aquí.
                                    </CardDescription>
                                    <div className="w-full flex justify-evenly flex-wrap">

                                        <UploadDocument 
                                            rowId={rowId || ''}
                                            customerName={decodedCustomerName || ''}
                                            companyName={companyName || ''}
                                            serviceName={decodedServiceName || ''}
                                            itemNames={itemName || ''}
                                        />

                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="w-full md:w-2/3">
                <CardContent className="p-0">
                    <embed
                        src={`${documentUrl}#&navpanes=0&scrollbar=0&zoom=110`}
                        className={cn(
                            'w-full h-auto max-h-[80vh] rounded-xl aspect-auto',
                            documentUrl?.split('.').pop()?.toLocaleLowerCase() === 'pdf' ? 'min-h-[80vh] ' : ''
                        )}
                    />

                </CardContent>
            </Card>
        </div>
    )
}
