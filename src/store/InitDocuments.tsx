'use client'
import { VehiclesAPI } from '@/types/types'
import { format } from 'date-fns'
import { useEffect, useRef } from 'react'
import { useLoggedUserStore } from './loggedUser'

export default function InitDocuments({
  data,
  equipmentData,
}: {
  equipmentData: any
  data: any
}) {
  const initState = useRef(false)

  useEffect(() => {
    if (!initState.current) {
      const typedData: VehiclesAPI[] | null = equipmentData as VehiclesAPI[]

      const lastMonth = new Date()
      lastMonth.setMonth(new Date().getMonth() + 1)

      const filteredData = data?.filter((doc: any) => {
        if (!doc.validity) return false

        const date = new Date(
          `${doc.validity.split('/')[1]}/${doc.validity.split('/')[0]}/${
            doc.validity.split('/')[2]
          }`,
        )
        const isExpired = date < lastMonth || doc.state === 'Vencido'
        return isExpired
      })

      const filteredVehiclesData = typedData?.filter((doc: any) => {
        if (!doc.validity) return false
        const date = new Date(
          `${doc.validity.split('/')[1]}/${doc.validity.split('/')[0]}/${
            doc.validity.split('/')[2]
          }`,
        )
        const isExpired = date < lastMonth || doc.state === 'Vencido'
        return isExpired
      })

      const formatDate = (dateString: string) => {
        if (!dateString) return 'No vence'
        const [day, month, year] = dateString.split('/')
        const formattedDate = `${day}/${month}/${year}`
        return formattedDate || 'No vence'
      }

      const mapDocument = (doc: any) => {
        const formattedDate = formatDate(doc.validity)
        return {
          date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
          allocated_to: doc.employees?.contractor_employee
            ?.map((doc: any) => doc.contractors.name)
            .join(', '),
          documentName: doc.document_types?.name,
          state: doc.state,
          multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
          validity: formattedDate,
          mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
          id: doc.id,
          resource: `${doc.employees?.lastname} ${doc.employees?.firstname}`,
          document_number: doc.employees.document_number,
          document_url: doc.document_path,
        }
      }

      const mapVehicle = (doc: any) => {
        const formattedDate = formatDate(doc.validity)
        return {
          date: doc.created_at
            ? format(new Date(doc.created_at), 'dd/MM/yyyy')
            : 'No vence',
          allocated_to: doc.applies?.type_of_vehicle?.name,
          documentName: doc.document_types?.name,
          state: doc.state,
          multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
          validity: formattedDate,
          mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
          id: doc.id,
          resource: doc.applies?.domain || doc.applies?.intern_number,
          vehicle_id: doc.applies?.id,
        }
      }

      const lastMonthValues = {
        employees:
          filteredData
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                doc.state !== 'pendiente' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            ?.map(mapDocument) || [],
        vehicles:
          filteredVehiclesData
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            .map(mapVehicle) || [],
      }

      const pendingDocuments = {
        employees:
          data
            ?.filter((doc: any) => doc.state === 'presentado')
            ?.map(mapDocument) || [],
        vehicles:
          typedData
            ?.filter((doc: any) => doc.state === 'presentado')
            .map(mapVehicle) || [],
      }

      const Allvalues = {
        employees:
          data
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            ?.map(mapDocument) || [],
        vehicles:
          typedData
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            ?.map(mapVehicle) || [],
      }

      const AllvaluesToShow = {
        employees: data?.map(mapDocument) || [],
        vehicles: typedData.map(mapVehicle) || [],
      }

      console.log(AllvaluesToShow, 'AllvaluesToShow')

      useLoggedUserStore.setState({
        allDocumentsToShow: AllvaluesToShow,
        showLastMonthDocuments: true,
        Alldocuments: Allvalues,
        lastMonthDocuments: lastMonthValues,
        documentsToShow: lastMonthValues,
        pendingDocuments: pendingDocuments,
      })
    }
    initState.current = true
  }, [])

  return <></>
}
