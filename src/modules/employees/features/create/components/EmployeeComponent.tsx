'use client';
require('dotenv').config();

import { Form } from '@/shared/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

import { DiagramDetailEmployeeView } from '@/modules/employees/features/diagrams/components/DiagramDetailEmployeeView';
import { EmployeeHeader } from '@/modules/employees/features/detail/components/EmployeeHeader';
import { EmployeePersonalDataTab } from '@/modules/employees/features/detail/components/EmployeePersonalDataTab';
import { EmployeeContactDataTab } from '@/modules/employees/features/detail/components/EmployeeContactDataTab';
import { EmployeeLaboralDataTab } from '@/modules/employees/features/detail/components/EmployeeLaboralDataTab';
import { useEmployeeFormLogic } from './useEmployeeForm';
import { EmployeeComponentProps } from '@/modules/employees/shared/types';

export default function EmployeeComponent({
  guild,
  user,
  diagrams,
  covenants,
  categories,
  children,
  diagrams_types,
  activeEmploees,
  historyData,
  role,
}: EmployeeComponentProps) {
  const {
    form,
    form2,
    accion,
    readOnly: rawReadOnly,
    setReadOnly: rawSetReadOnly,
    accordion1Errors,
    accordion2Errors,
    accordion3Errors,
    PERSONALDATA,
    CONTACTDATA,
    LABORALDATA,
    handleProvinceChange,
    handleImageChange,
    base64Image,
    onCreate,
    onUpdate,
    onDelete,
    showModal,
    setShowModal,
    today,
    month,
    setMonth,
    yearsAhead,
    years,
    setYear,
    guildId,
    covenantsId,
  } = useEmployeeFormLogic(user, guild, covenants, categories);

  // Empleados dados de baja: forzar solo lectura. La única acción habilitada
  // es reactivar (botón en EmployeeHeader); editar campos queda bloqueado.
  const isInactive = user && user.is_active === false;
  const readOnly = isInactive ? true : rawReadOnly;
  const setReadOnly = isInactive ? () => {} : rawSetReadOnly;

  return (
    <section>
      <EmployeeHeader
        accion={accion}
        user={user}
        role={role}
        readOnly={readOnly}
        setReadOnly={setReadOnly}
        showModal={showModal}
        setShowModal={setShowModal}
        form2={form2}
        onDelete={onDelete}
        today={today}
        month={month}
        setMonth={setMonth}
        yearsAhead={yearsAhead}
        years={years}
        setYear={setYear}
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(accion === 'edit' || accion === 'view' ? onUpdate : onCreate)}
          className="w-full"
        >
          <Tabs defaultValue="personalData" className="w-full m-4">
            <TabsList>
              <TabsTrigger value={'personalData'} className={cn(accordion1Errors && 'bg-red-300 text-red-50')}>
                Datos Personales
              </TabsTrigger>
              <TabsTrigger value={'contactData'} className={cn(accordion2Errors && 'bg-red-300 text-red-50')}>
                Datos de Contacto
              </TabsTrigger>
              <TabsTrigger value={'workData'} className={cn(accordion3Errors && 'bg-red-300 text-red-50')}>
                Datos Laborales
              </TabsTrigger>
              {user && <TabsTrigger value="documents">Documentación</TabsTrigger>}
              {user && <TabsTrigger value="diagrams">Diagramas</TabsTrigger>}
            </TabsList>
            <TabsContent value="personalData" className="px-2 py-2">
              <EmployeePersonalDataTab
                form={form}
                PERSONALDATA={PERSONALDATA}
                readOnly={readOnly}
                accordion1Errors={accordion1Errors}
                handleImageChange={handleImageChange}
                base64Image={base64Image}
                today={today}
                month={month}
                setMonth={setMonth}
                yearsAhead={yearsAhead}
                years={years}
                setYear={setYear}
              />
            </TabsContent>
            <TabsContent value="contactData" className="px-2 py-2">
              <EmployeeContactDataTab
                form={form}
                CONTACTDATA={CONTACTDATA}
                readOnly={readOnly}
                accordion2Errors={accordion2Errors}
                handleProvinceChange={handleProvinceChange}
              />
            </TabsContent>
            <TabsContent value="workData" className="px-2 py-2">
              <EmployeeLaboralDataTab
                form={form}
                LABORALDATA={LABORALDATA}
                readOnly={readOnly}
                accordion3Errors={accordion3Errors}
                role={role}
                guildId={guildId}
                covenantsId={covenantsId}
                guild={guild}
                covenants={covenants}
                today={today}
                month={month}
                setMonth={setMonth}
                yearsAhead={yearsAhead}
                years={years}
                setYear={setYear}
              />
            </TabsContent>
            <TabsContent value="documents" className="px-2 py-2">
              {children}
            </TabsContent>
            <TabsContent value="diagrams" className="px-2 py-2">
              <DiagramDetailEmployeeView role={role} historyData={historyData} diagrams={diagrams as any} diagrams_types={diagrams_types} activeEmploees={activeEmploees} />
            </TabsContent>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="w-fit">
                    {!isInactive && (accion !== 'view' || !readOnly) ? (
                      <Button type="submit" className="mt-5 ml-2">
                        {accion === 'edit' || accion === 'view' ? 'Guardar cambios' : 'Agregar empleado'}
                      </Button>
                    ) : null}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                  {!accordion1Errors && !accordion2Errors && !accordion3Errors
                    ? '¡Todo listo para agregar el empleado!'
                    : '¡Completa todos los campos para agregar el empleado'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Tabs>
        </form>
      </Form>
    </section>
  );
}
