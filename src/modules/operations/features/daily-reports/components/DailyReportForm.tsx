'use client';

import { Button } from '@/shared/components/ui/button';
import { Form, FormField, FormItem, FormLabel } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { FormProvider } from 'react-hook-form';
import { format } from 'date-fns';
import MultiSelect from './MultiSelect';
import GenericDialog from './GenericDialog';
import { Customers, Employee, Equipment, Services, Items, DailyReportData } from './types';

interface DailyReportFormProps {
  formMethods: any;
  handleSubmit: any;
  control: any;
  setValue: any;
  watch: any;
  onSubmit: (data: any) => Promise<void>;
  editingId: string | null;
  customers: Customers[];
  customerServices: Services[];
  customerItems: Items[];
  customerEmployees: Employee[];
  customerEquipment: Equipment[];
  workingDay: string;
  handleSelectCustomer: (customerId: string, reportDate: Date) => void;
  handleSelectService: (serviceId: string) => void;
  handleWorkingDayChange: (value: string) => void;
  handleValueChange: (value: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  isDialogOpen: boolean;
  futureReports: DailyReportData[];
  selectedDate: String | null;
  setSelectedDate: (v: string) => void;
  handleCloseDialog: () => void;
  handleSaveToDailyReport: () => Promise<void>;
  setIsEditing: (v: boolean) => void;
  resetForm: () => void;
  reportData: any;
}

export function DailyReportForm({
  formMethods, handleSubmit, control, setValue, watch, onSubmit,
  editingId, customers, customerServices, customerItems, customerEmployees,
  customerEquipment, workingDay, handleSelectCustomer, handleSelectService,
  handleWorkingDayChange, handleValueChange, startTime, setStartTime,
  endTime, setEndTime, isDialogOpen, futureReports, selectedDate,
  setSelectedDate, handleCloseDialog, handleSaveToDailyReport,
  setIsEditing, resetForm, reportData,
}: DailyReportFormProps) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{editingId ? 'Editar Fila' : 'Agregar Nueva Fila'}</h1>
      <FormProvider {...formMethods}>
        <Form {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="customer"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSelectCustomer(value, reportData?.date ? new Date(reportData.date) : new Date());
                    }}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {customers?.map((customer: Customers) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-red-500">{fieldState.error.message}</p>}
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="services"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Servicios</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSelectService(value);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Seleccione el servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Servicios</SelectLabel>
                        {customerServices?.map((service: Services) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.service_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-red-500">{fieldState.error.message}</p>}
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="item"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Seleccione un item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Items</SelectLabel>
                        {customerItems?.map((item: Items) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.item_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-red-500">{fieldState.error.message}</p>}
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="employees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block w-full max-w-xs">Empleados</FormLabel>
                  <div className="w-full max-w-xs">
                    <MultiSelect
                      multiEmp={customerEmployees.map((employee: Employee) => ({
                        id: employee.id,
                        name: `${employee.firstname} ${employee.lastname}`,
                      }))}
                      placeholder="Seleccione empleados"
                      selectedItems={field.value}
                      onChange={(selected: any) => field.onChange(selected)}
                    />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block w-full max-w-xs">Equipos</FormLabel>
                  <MultiSelect
                    multiEmp={customerEquipment.map((eq: Equipment) => ({
                      id: eq.id,
                      intern_number: eq.intern_number.toString(),
                    }))}
                    placeholder="Seleccione equipos"
                    selectedItems={field.value}
                    onChange={(selected: any) => field.onChange(selected)}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="working_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jornada</FormLabel>
                  <Select
                    value={field.value || workingDay}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleWorkingDayChange(value);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Tipo de jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="jornada 8 horas">Jornada 8 horas</SelectItem>
                        <SelectItem value="jornada 12 horas">Jornada 12 horas</SelectItem>
                        <SelectItem value="por horario">Por horario</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {isDialogOpen && (
              <>
                {watch('status') === 'reprogramado' && (
                  <GenericDialog
                    title="Reprogramar Reporte"
                    description="Selecciona un parte diario para reprogramar este reporte."
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                  >
                    <div className="max-w-[45vw] mx-auto">
                      <Select onValueChange={(value) => setSelectedDate(value)}>
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Seleccione un parte diario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {futureReports.map((futureReport) => (
                              <SelectItem key={futureReport.id} value={futureReport.id}>
                                {format(new Date(futureReport.date), 'dd/MM/yyyy')}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <div className="mt-4 flex justify-center w-full">
                        <Button variant="outline" onClick={handleCloseDialog} className="mr-2">
                          Cerrar
                        </Button>
                        <Button onClick={handleSaveToDailyReport} disabled={!selectedDate}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </GenericDialog>
                )}
                {watch('status') === 'ejecutado' && (
                  <GenericDialog
                    title="Confirmar Estado Ejecutado"
                    description="Si se pasa el estado a ejecutado, no se podrá modificar más."
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                  >
                    <div className="max-w-[45vw] mx-auto">
                      <div className="mt-4 flex justify-center w-full">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setValue('status', 'pendiente');
                            handleCloseDialog();
                          }}
                          className="mr-2"
                        >
                          Cancelar
                        </Button>
                        <Button onClick={() => handleCloseDialog()}>
                          Aceptar
                        </Button>
                      </div>
                    </div>
                  </GenericDialog>
                )}
              </>
            )}
            {workingDay === 'por horario' && (
              <>
                <FormField
                  control={control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de inicio</FormLabel>
                      <Input
                        type="time"
                        name="start_time"
                        value={startTime ? startTime : field.value}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        className="w-full max-w-xs"
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de finalización</FormLabel>
                      <Input
                        type="time"
                        name="end_time"
                        value={field.value || endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        className="w-full max-w-xs"
                      />
                    </FormItem>
                  )}
                />
              </>
            )}
            {editingId && (
              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleValueChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="ejecutado">Ejecutado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="reprogramado">Reprogramado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="w-full max-w-xs">Descripción</FormLabel>
                  <Textarea placeholder="Ingrese una breve descripción" className="resize-none" {...field} />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full max-w-xs">
              {editingId ? 'Guardar Cambios' : 'Agregar Fila'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsEditing(false);
                resetForm();
              }}
              variant="outline"
              className="w-full max-w-xs"
            >
              Cancelar
            </Button>
          </form>
        </Form>
      </FormProvider>
    </>
  );
}