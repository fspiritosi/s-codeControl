'use client';

import { useState } from 'react';
import VehicleInspectionChecklist from './ChecklistSergio';
import DynamicChecklistForm from './DynamicChecklistForm';
import VehicleMaintenanceChecklist from './VehicleInspectionChecklist';

type FormType =
  | 'Transporte SP-ANAY - CHK - HYS - 01'
  | 'Transporte SP-ANAY - CHK - HYS - 04'
  | 'Transporte SP-ANAY - CHK - HYS - 03';

interface DynamicFormWrapperProps {
  formType: FormType;
  equipments?: {
    label: string;
    value: string;
    domain: string | null;
    serie: string | null;
    kilometer: string;
    model: string | null;
    brand: string | null;
    intern_number: string;
  }[];
  currentUser?: Profile[];
  defaultAnswer?: CheckListAnswerWithForm[];
  form_Info: CustomForm[];
  dynamicFormConfig?: any; // Add the type for your dynamic form configuration
  resetQrSelection?: (formType: string) => void;
  default_equipment_id?: string;
  empleado_name?: string | undefined;
  singurl?: string | null;
}

export default function DynamicFormWrapper({
  formType,
  equipments,
  currentUser,
  defaultAnswer,
  form_Info,
  dynamicFormConfig,
  resetQrSelection,
  default_equipment_id,
  empleado_name,
  singurl,
}: DynamicFormWrapperProps) {
  const [activeFormType, setActiveFormType] = useState<FormType>(formType);

  const renderForm = () => {
    switch (activeFormType) {
      case 'Transporte SP-ANAY - CHK - HYS - 01':
        return (
          <VehicleInspectionChecklist
            equipments={equipments}
            currentUser={currentUser}
            defaultAnswer={defaultAnswer}
            form_Info={form_Info}
            resetQrSelection={resetQrSelection}
            default_equipment_id={default_equipment_id}
            empleado_name={empleado_name}
            singurl={singurl}
          />
        );

      case 'Transporte SP-ANAY - CHK - HYS - 04':
        return (
          <DynamicChecklistForm
            currentUser={currentUser}
            equipments={equipments}
            config={dynamicFormConfig}
            defaultAnswer={defaultAnswer}
            form_Info={form_Info}
            resetQrSelection={resetQrSelection}
            default_equipment_id={default_equipment_id}
            empleado_name={empleado_name}
            singurl={singurl}
          />
        );

      case 'Transporte SP-ANAY - CHK - HYS - 03':
        return (
          <VehicleMaintenanceChecklist
            equipments={equipments}
            currentUser={currentUser}
            defaultAnswer={defaultAnswer}
            form_Info={form_Info}
            resetQrSelection={resetQrSelection}
            default_equipment_id={default_equipment_id}
            empleado_name={empleado_name}
            singurl={singurl}
          />
        );

      default:
        return <div>No form type selected</div>;
    }
  };

  return <div>{renderForm()}</div>;
}
