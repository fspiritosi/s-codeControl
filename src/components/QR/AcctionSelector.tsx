'use client';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { setVehiclesToShow } from '@/lib/utils/utils';
import { RepairsSolicituds, TypeOfRepair } from '@/types/types';
import { LapTimerIcon } from '@radix-ui/react-icons';
import { User } from '@supabase/supabase-js';
import cookies from 'js-cookie';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiTool } from 'react-icons/fi';
import { Badge } from '../ui/badge';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import CompletarChecklist from './CompletarChecklist';
import SolicitarMantenimiento from './SolicitarMantenimiento';
import VehicleRepairRequests from './VehicleRepairRequests';

export default function QrActionSelector({
  empleado_name,
  user,
  tipo_de_mantenimiento,
  equipment,
  default_equipment_id,
  employee_id,
  role,
  pendingRequests,
  checkList,
  equipmentsForComboBox,
}: {
  empleado_name: string | undefined;
  user: User | null;
  employee_id: string | undefined;
  tipo_de_mantenimiento: TypeOfRepair;
  equipment: ReturnType<typeof setVehiclesToShow>;
  default_equipment_id?: string;
  role: string | undefined;
  pendingRequests: RepairsSolicituds;
  checkList: CheckListWithAnswer[];
  equipmentsForComboBox: {
    label: string;
    value: string;
    domain: string | null;
    serie: string | null;
    kilometer: string;
    model: string | null;
    brand: string | null;
    intern_number: string;
  }[];
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const supabase = supabaseBrowser();
  const router = useRouter();

  if (!employee_id && !user?.id) {
    router.push('/maintenance');
  }

  const handleBack = async () => {
    await supabase.auth.signOut();
    cookies.remove('empleado_id');
    cookies.remove('empleado_name');
    router.push('/maintenance/thanks');
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleReturn = () => {
    setSelectedOption(null);
  };

  if (selectedOption === 'mantenimiento') {
    return (
      <SolicitarMantenimiento
        equipment={equipment}
        tipo_de_mantenimiento={tipo_de_mantenimiento}
        default_equipment_id={default_equipment_id}
        onReturn={handleReturn}
        employee_id={employee_id}
        user={user}
      />
    );
  }

  if (selectedOption === 'checklist') {
    return (
      <CompletarChecklist
        empleado_name={empleado_name}
        default_equipment_id={default_equipment_id}
        equipmentsForComboBox={equipmentsForComboBox}
        checkList={checkList}
        onReturn={handleReturn}
      />
    );
  }
  if (selectedOption === 'VehicleRepairRequests') {
    return <VehicleRepairRequests pendingRequests={pendingRequests} onReturn={handleReturn} />;
  }

  // console.log('role', role);
  // console.log('user.id', user?.id);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-2">
      <Card className="w-full max-w-md space-y-6 rounded-xl bg-white p-6 py-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
          </div>
          <CardDescription className="text-center text-gray-600">
            Sistema de Checklist y Mantenimiento de Equipos
          </CardDescription>
          <div className="p-3 flex justify-center flex-col items-center">
            <CardDescription className="underline mt-2 text-lg">Informacion del equipo</CardDescription>
            <Badge className="text-center flex justify-center w-fit mt-3 text-lg">
              {equipment[0].domain ? 'Dominio: ' + equipment[0].domain : 'Serie: ' + equipment[0].serie}
            </Badge>
            <Badge className="text-center flex justify-center w-fit mt-3 text-lg">
              {'Numero Interno: ' + equipment[0].intern_number}
            </Badge>
          </div>
        </CardHeader>
        <CardTitle className="text-center text-3xl font-bold text-gray-900 mt-0">Seleccione una opción</CardTitle>
        <div className="space-y-4">
          {(!user?.id || role !== 'Invitado') && (
            <Button
              className="w-full py-6 text-lg"
              variant="default"
              onClick={() => handleOptionSelect('mantenimiento')}
            >
              <FiTool className="mr-2 h-6 w-6" />
              Solicitar Mantenimiento
            </Button>
          )}

          <Button
            className="w-full py-6 text-lg"
            variant="outline"
            onClick={() => handleOptionSelect('VehicleRepairRequests')}
          >
            <LapTimerIcon className="mr-2 h-6 w-6" />
            Ver Solicitudes Pendientes
          </Button>
          <Button className="w-full py-6 text-lg" variant="outline" onClick={() => handleOptionSelect('checklist')}>
            <ClipboardList className="mr-2 h-6 w-6" />
            Completar Checklist
          </Button>
          <CardFooter className="px-0 mx-0">
            <Button
              variant="outline"
              className="w-full border-[#3BB3E3] text-[#3BB3E3] hover:bg-[#E6F7FF] text-lg"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Salir
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
