import moment from 'moment';
import Image from 'next/image';
import { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import DynamicFormWrapper from '../CheckList/DynamicFormWrapper';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

function CompletarChecklist({
  onReturn,
  checkList,
  equipmentsForComboBox,
  default_equipment_id,
  empleado_name,
}: {
  onReturn: () => void;
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
  default_equipment_id?: string;
  empleado_name?: string | undefined;
}) {
  const [activeFormType, setActiveFormType] = useState<string>('');

  if (activeFormType) {
    return (
      <DynamicFormWrapper
        form_Info={[checkList.find((e) => e.name === activeFormType)] as CustomForm[]}
        formType={activeFormType as any}
        resetQrSelection={setActiveFormType}
        equipments={equipmentsForComboBox}
        default_equipment_id={default_equipment_id}
        empleado_name={empleado_name}
      />
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <CardHeader className="flex justify-center">
        <div className="flex items-center justify-center mb-4">
          <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
        </div>
        <CardDescription className="text-center text-gray-600">
          Sistema de Checklist y Mantenimiento de Equipos
        </CardDescription>
      </CardHeader>
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Tipos de checklist</h1>
        <div className="flex justify-center">
          <Button onClick={onReturn} variant={'ghost'} className="self-end">
            <FiArrowLeft className="mr-2 h-6 w-6" />
            Regresar
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-500">Aquí encontraras los checklist de mantenimiento</p>
      {checkList.map((checklist) => (
        <Card
          key={checklist.id}
          className="w-full hover:cursor-pointer hover:bg-gray-100"
          onClick={() => {
            // console.log(checklist.name, 'checklist.name');
            setActiveFormType(checklist.name);
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg">{(checklist.form as { description: string }).description}</CardTitle>
            <div className="flex justify-between items-center">
              <Badge variant="secondary">{(checklist.form as { frequency: string }).frequency}</Badge>
              <span className="text-sm text-gray-500">{moment(checklist.created_at).format('DD/MM/YYYY')}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{checklist.name}</p>
          </CardContent>
        </Card>
      ))}
    </Card>
  );
}

export default CompletarChecklist;
