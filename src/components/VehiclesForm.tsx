'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode } from 'react';
import { useVehicleForm } from './VehiclesForm/useVehicleForm';
import { VehicleHeader } from './VehiclesForm/VehicleHeader';
import { VehicleEquipmentForm } from './VehiclesForm/VehicleEquipmentForm';
import { VehicleQRTab } from './VehiclesForm/VehicleQRTab';

// Backward-compatible re-exports
export type { generic } from './VehiclesForm/types';

export default function VehiclesForm2({
  vehicle,
  children,
  types: vehicleType,
  brand_vehicles,
  role,
}: {
  vehicle: any | null;
  children: ReactNode;
  types: { name: string; id: string }[];
  brand_vehicles: VehicleBrand[] | null;
  role?: string;
}) {
  const {
    form, accion, readOnly, setReadOnly, hideInput, setHideInput,
    type, setType, types, vehicleModels, contractorCompanies,
    fetchModels, fetchData, onCreate, onUpdate, handleImageChange, base64Image,
    qrUrl, qrCodeRef, downloadQR, printQR, actualCompanyId,
  } = useVehicleForm(vehicle, vehicleType, brand_vehicles);

  return (
    <section className="flex flex-col gap-4 w-full">
      <VehicleHeader
        accion={accion}
        vehicle={vehicle}
        role={role}
        readOnly={readOnly}
        setReadOnly={setReadOnly}
      />
      <Tabs defaultValue="equipment" className="w-full ">
        <TabsList className="mx-3 py-2">
          <TabsTrigger value="equipment">Equipo</TabsTrigger>
          {accion !== 'new' && <TabsTrigger value="documents">Documentos</TabsTrigger>}
          {accion !== 'new' && <TabsTrigger value="repairs">Reparaciones</TabsTrigger>}
          {accion !== 'new' && <TabsTrigger value="QR">QR</TabsTrigger>}
        </TabsList>
        <TabsContent value="equipment" className="px-3 py-2">
          <VehicleEquipmentForm
            form={form}
            accion={accion}
            readOnly={readOnly}
            hideInput={hideInput}
            setHideInput={setHideInput}
            type={type}
            setType={setType}
            types={types}
            vehicleModels={vehicleModels}
            contractorCompanies={contractorCompanies}
            vehicleType={vehicleType}
            brand_vehicles={brand_vehicles}
            vehicle={vehicle}
            role={role}
            fetchModels={fetchModels}
            fetchData={fetchData}
            actualCompanyId={actualCompanyId}
            onCreate={onCreate}
            onUpdate={onUpdate}
            handleImageChange={handleImageChange}
            base64Image={base64Image}
          />
        </TabsContent>
        {children}
        <TabsContent value="QR" className="px-3 py-2 pt-5">
          <VehicleQRTab
            qrUrl={qrUrl}
            qrCodeRef={qrCodeRef}
            downloadQR={downloadQR}
            printQR={printQR}
            vehicle={vehicle}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
