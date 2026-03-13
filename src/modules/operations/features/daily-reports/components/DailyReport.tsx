'use client';

import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardDescription } from '@/shared/components/ui/card';
import GenericDialog from './GenericDialog';
import DailyReportSkeleton from '@/shared/components/common/Skeletons/DayliReportSkeleton';
import DocumentView from './DocumentView';
import { dailyColumns } from './tables/DailyReportColumns';
import { TypesOfCheckListTable } from './tables/data-table-dily-report';
import BtnXlsDownload from '@/shared/components/common/BtnXlsDownload';
import { getCustomerName, getServiceName, getItemName, getEmployeeNames, getEquipmentNames } from './utils/utils';
import { DailyReportForm } from './DailyReportForm';
import { useDailyReport } from './useDailyReport';

// Re-export types for backward compatibility
export type { Customers, Employee, Equipment, Services, Items, DailyReportItem } from './types';

export interface DailyReportProps {
  reportData?: {
    id: string;
    date: string;
    status: boolean;
    dailyreportrows: import('./types').DailyReportItem[];
  } | undefined;
  allReport?: {
    id: string;
    date: string;
    status: boolean;
    dailyreportrows: import('./types').DailyReportItem[];
  }[];
}

export default function DailyReport({ reportData, allReport }: DailyReportProps) {
  const hook = useDailyReport({ reportData, allReport });
  const {
    companyName, employees, customers, selectedCustomer, customerEmployees,
    startTime, setStartTime, endTime, setEndTime, equipment, customerEquipment,
    services, customerServices, selectedService, items, customerItems,
    dailyReport, editingId, isEditing, setIsEditing, confirmDelete,
    setConfirmDelete, selectRow, workingDay, isDialogOpen, futureReports,
    selectedDate, setSelectedDate, filaId, filteredRow, isLoading,
    isDialogOpen2, formMethods, handleSubmit, control, setValue, watch,
    canEdit, handleSelectCustomer, handleSelectService, handleAddNewRow,
    resetForm, handleEdit, handleConfirmOpen, handleConfirmClose, handleDelete,
    handleWorkingDayChange, onSubmit, handleValueChange, handleCloseDialog,
    handleSaveToDailyReport, handleViewDocument, closeDialog2,
    createDataToDownload, documentUrl,
  } = hook;

  if (isLoading) {
    return <DailyReportSkeleton />;
  }

  return (
    <div className="mx-auto p-4">
      <div className="relative w-full h-full overflow-hidden">
        <motion.div className="flex w-full" animate={{ height: 'auto' }} transition={{ duration: 0.3 }}>
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '23%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pr-4 overflow-hidden"
              >
                <DailyReportForm
                  formMethods={formMethods}
                  handleSubmit={handleSubmit}
                  control={control}
                  setValue={setValue}
                  watch={watch}
                  onSubmit={onSubmit}
                  editingId={editingId}
                  customers={customers}
                  customerServices={customerServices}
                  customerItems={customerItems}
                  customerEmployees={customerEmployees}
                  customerEquipment={customerEquipment}
                  workingDay={workingDay}
                  handleSelectCustomer={handleSelectCustomer}
                  handleSelectService={handleSelectService}
                  handleWorkingDayChange={handleWorkingDayChange}
                  handleValueChange={handleValueChange}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  isDialogOpen={isDialogOpen}
                  futureReports={futureReports}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  handleCloseDialog={handleCloseDialog}
                  handleSaveToDailyReport={handleSaveToDailyReport}
                  setIsEditing={setIsEditing}
                  resetForm={resetForm}
                  reportData={reportData}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ width: isEditing ? '77%' : '100%' }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto"
          >
            {canEdit && (
              <div className="flex justify-end items-center mb-4">
                <Button onClick={handleAddNewRow} className="items-end">
                  <PlusCircledIcon className="mr-2 h-4 w-4" />
                  Agregar Fila
                </Button>
              </div>
            )}

            <TypesOfCheckListTable
              columns={dailyColumns(handleViewDocument, handleEdit, handleConfirmOpen, canEdit as any, customers, services, items, companyName as any)}
              data={dailyReport || ''}
              customers={customers}
              services={services}
              items={items}
              employees={employees}
              equipment={equipment}
              companyName={companyName || ''}
              handleViewDocument={function (documentPath: string, row_id?: string): Promise<void> {
                throw new Error('Function not implemented.');
              }}
            />
            <BtnXlsDownload fn={createDataToDownload} dataToDownload={dailyReport} nameFile={`'Parte_Diario'${reportData?.date}`} />
          </motion.div>
        </motion.div>
      </div>
      <GenericDialog isOpen={isDialogOpen2} onClose={closeDialog2} title="" description="">
        <Card className="mb-2 w-full max-w-5xl mx-auto h-[85vh]">
          <CardDescription className="p-3 flex justify-center items-center h-full">
            <DocumentView
              rowId={filaId || ''}
              row={(filteredRow as any) || ''}
              documentUrl={documentUrl || ''}
              customerName={getCustomerName(selectedCustomer?.id || '', customers)}
              companyName={companyName || ''}
              serviceName={getServiceName(selectedService?.id || '', services)}
              itemNames={getItemName(selectedService?.item_id || '', items)}
              employeeNames={filteredRow?.employees.map((emp: string) => getEmployeeNames([emp], employees))}
              equipmentNames={filteredRow?.equipment.map((eq: string) => getEquipmentNames([eq], equipment))}
            />
          </CardDescription>
        </Card>
      </GenericDialog>
      {confirmDelete && (
        <div>
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogContent className="w-full max-w-fit mx-auto p-2 flex flex-col items-center">
              <DialogTitle className="text-xl font-semibold mb-4">Confirmar Eliminación</DialogTitle>
              <DialogDescription className="text-center mb-4">
                ¿Estás seguro de que deseas eliminar esta fila?
              </DialogDescription>
              <div className="flex justify-center mt-2 space-x-2">
                <Button onClick={handleConfirmClose} className="mr-2">
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleDelete(selectRow as any);
                    handleConfirmClose();
                  }}
                  variant="destructive"
                >
                  Eliminar
                </Button>
              </div>
            </DialogContent>
            <DialogFooter className="flex justify-center">
              <Button onClick={handleConfirmClose} variant="outline">
                Cerrar
              </Button>
            </DialogFooter>
          </Dialog>
        </div>
      )}
    </div>
  );
}