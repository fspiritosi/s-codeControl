'use client';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { User } from '@supabase/supabase-js';
import cookies from 'js-cookie';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiTool } from 'react-icons/fi';
import { Card, CardDescription, CardFooter, CardHeader } from '../ui/card';
import CompletarChecklist from './CompletarChecklist';
import SolicitarMantenimiento from './SolicitarMantenimiento';

export default function QrActionSelector({
  employee,
  user,
  tipo_de_mantenimiento,
  equipment,
  default_equipment_id,
  employee_id,
}: {
  employee: string | undefined;
  user: User | null;
  employee_id: string | undefined;
  tipo_de_mantenimiento: TypeOfRepair;
  equipment: ReturnType<typeof setVehiclesToShow>;
  default_equipment_id?: string;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const supabase = supabaseBrowser();
  const router = useRouter();

  const handleBack = async () => {
    await supabase.auth.signOut();
    cookies.remove('empleado_id');
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
    return <CompletarChecklist onReturn={handleReturn} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-2">
      <Card className="w-full max-w-md space-y-8 rounded-xl bg-white p-6 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
          </div>
          <CardDescription className="text-center text-gray-600">
            Sistema de Checklist y Mantenimiento de Equipos
          </CardDescription>
        </CardHeader>
        <h1 className="text-center text-3xl font-bold text-gray-900">Seleccione una opción</h1>
        <div className="space-y-4">
          {!user?.id && (
            <Button
              className="w-full py-6 text-lg"
              variant="default"
              onClick={() => handleOptionSelect('mantenimiento')}
            >
              <FiTool className="mr-2 h-6 w-6" />
              Solicitar Mantenimiento
            </Button>
          )}
          <Button className="w-full py-6 text-lg" variant="outline" onClick={() => handleOptionSelect('checklist')}>
            <ClipboardList className="mr-2 h-6 w-6" />
            Completar Checklist
          </Button>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-[#3BB3E3] text-[#3BB3E3] hover:bg-[#E6F7FF]"
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
