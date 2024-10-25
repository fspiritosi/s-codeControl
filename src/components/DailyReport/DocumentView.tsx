'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Download, ArrowLeft } from 'lucide-react'
import cookies from 'js-cookie'
import UploadDocument from './UploadDocument'
import InfoComponent from '../InfoComponent'
import moment from 'moment'

interface DailyReportItem {
    id: string
    date: string
    working_day: string
    customer: string | undefined
    employees: string[]
    equipment: string[]
    services: string
    item: string
    start_time: string
    end_time: string
    status: 'pendiente' | 'ejecutado' | 'cancelado' | 'reprogramado'
    description: string
    document_path?: string
}

interface DocumentViewProps {
    documentUrl: string
    rowId: string
    customerName?: string
    companyName?: string
    serviceName?: string
    itemNames?: string
    row?: DailyReportItem
    employeeNames?: string[]
    equipmentNames?: string[]
}
export default function DocumentView({ documentUrl, row, rowId, customerName, companyName, serviceName, itemNames, employeeNames, equipmentNames }: DocumentViewProps) {
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
    
    if (isLoading) {
        return (
            <div className="flex flex-col lg:flex-row gap-6 p-6 w-[95vw]">
            <Card className="w-[95vw] lg:w-2/5">
                <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent>
                <div className="flex justify-between mb-4">
                    <Skeleton className="h-10 w-32" />
                </div>
                <Tabs defaultValue="operations">
                    <TabsList className="grid w-full grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    </TabsList>
                    <TabsContent value="operations">
                    <Card>
                        <div className="space-y-2 ml-4 mb-4 gap-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        </div>
                    </Card>
                    </TabsContent>
                    <TabsContent value="actualizar">
                    <Card>
                        <div className="p-3 text-center space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="w-full flex justify-evenly flex-wrap">
                            <Skeleton className="h-10 w-32" />
                        </div>
                        </div>
                    </Card>
                    </TabsContent>
                </Tabs>
                </CardContent>
            </Card>
            <Card className="w-full md:w-2/3">
                <CardContent className="p-0">
                <Skeleton className="w-full h-[80vh]" />
                </CardContent>
            </Card>
            </div>
        )
    }

    
    const urlParts = documentUrl.split('/');
    const decodedParts = urlParts.map(decodeURIComponent);
    const [decodedCustomerName, decodedServiceName, itemName] = decodedParts.slice(-4, -1);
   
    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 w-[95vw]">
            <Card className="w-[95vw] lg:w-2/5">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">Datos del Documento</CardTitle>
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
                       
                    </div>

                    <Tabs defaultValue="operations">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="operations">Operación</TabsTrigger>
                            <TabsTrigger value="actualizar">Actualizar</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="operations">
                            <Card>
                                <h3 className="text-lg text-center font-semibold">Operaciones</h3>
                                <div className="space-y-2 ml-4 mb-4 gap-2">
                                    <p><strong>N° de Remito:</strong> {documentUrl.substring(documentUrl.lastIndexOf('-') + 1, documentUrl.lastIndexOf('.'))}</p>
                                    <p><strong>Fecha:</strong> {row?.date ? moment(row.date).format('DD/MM/YYYY') : 'N/A'}</p>
                                    <p><strong>Cliente:</strong> {decodedCustomerName}</p>
                                    <p><strong>Servicio:</strong> {decodedServiceName}</p>
                                    <p><strong>Item:</strong> {itemName}</p>
                                    <p><strong>Empleados Asignados:</strong> {employeeNames ? employeeNames.join(', ') : 'N/A'}</p>
                                    <p><strong>Equipos Asignados:</strong> {equipmentNames ? equipmentNames.join(', ') : 'N/A'}</p>
                                    <p><strong>Jornada:</strong> {row?.working_day || 'N/A'}</p>
                                    <p><strong>Estado:</strong> {row?.status || 'N/A'}</p>
                                </div>
                            </Card>
                        </TabsContent>
                        <TabsContent value="actualizar">
                            <Card>
                                <div className="p-3 text-center space-y-3">
                                    <CardDescription>
                                        <InfoComponent size='md' message={`Si el documento subido no es el correcto, puedes actualizarlo aquí.`} />

                                    </CardDescription>
                                    <div className="w-full flex justify-evenly flex-wrap">

                                        <UploadDocument
                                            rowId={rowId || ''}
                                            customerName={decodedCustomerName || ''}
                                            companyName={companyName || ''}
                                            serviceName={decodedServiceName || ''}
                                            itemNames={itemName || ''}
                                            isReplacing={true}
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
