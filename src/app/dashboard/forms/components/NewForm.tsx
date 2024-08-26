'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Campo, types } from '@/types/types';
import { useState } from 'react';
import { FormCustom } from './FormCustom';
import { FormDisplay } from './FormDisplay';
function NewForm() {
  const [campos, setCampos] = useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
      title: 'Nombre del formulario',
      opciones: [],
    },
  ]);

  return (
    <div className="min-h-[60vh]">
      <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup direction="horizontal" className=" items-stretch p-0 m-0">
          <ResizablePanel minSize={30}>
            <FormCustom setCampos={setCampos} campos={campos} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="relative" minSize={30}>
            <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
            <FormDisplay campos={campos} setCampos={setCampos} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>
    </div>
  );
}

export default NewForm;
