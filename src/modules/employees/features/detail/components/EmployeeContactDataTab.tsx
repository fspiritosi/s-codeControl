'use client';

import { SelectWithData } from '@/shared/components/common/SelectWithData';
import { Badge } from '@/shared/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { names } from '@/shared/types/types';
import { UseFormReturn } from 'react-hook-form';

interface EmployeeContactDataTabProps {
  form: UseFormReturn<any>;
  CONTACTDATA: any[];
  readOnly: boolean;
  accordion2Errors: boolean;
  handleProvinceChange: (name: any) => void;
}

export function EmployeeContactDataTab({
  form,
  CONTACTDATA,
  readOnly,
  accordion2Errors,
  handleProvinceChange,
}: EmployeeContactDataTabProps) {
  return (
    <>
      {accordion2Errors && (
        <Badge className="h-6" variant="destructive">
          Falta corregir algunos campos
        </Badge>
      )}
      <div className="min-w-full max-w-sm flex flex-wrap gap-8">
        {CONTACTDATA?.map((data) => {
          if (data.type === 'select') {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name={data.name as names}
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>
                          {data.label}
                          <span style={{ color: 'red' }}> *</span>
                        </FormLabel>
                        <FormControl>
                          <SelectWithData
                            disabled={readOnly}
                            placeholder={data.placeholder}
                            field={{ ...field }}
                            options={data.options}
                            editing={true}
                            value={field.value || ''}
                            handleProvinceChange={data.label === 'Provincia' ? handleProvinceChange : undefined}
                            onChange={(event: any) => {
                              if (data.name === 'province') {
                                handleProvinceChange(event);
                              }
                              field.onChange(event);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            );
          } else {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name={data.name as names}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {data.label}
                        <span style={{ color: 'red' }}> *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={readOnly}
                          type={data.type}
                          id={data.label}
                          placeholder={data.placeholder}
                          className="w-[300px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            );
          }
        })}
      </div>
    </>
  );
}
