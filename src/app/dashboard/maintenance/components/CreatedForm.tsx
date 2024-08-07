'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Campo, types } from '@/types/types';
import cookie from 'js-cookie';
import { useEffect, useState } from 'react';
import DisplayCreatedForms from './DisplayCreatedForms';
import { FormDisplay } from './FormDisplay';
function CreatedForm() {
  const [createdFormsState, setCreatedFormsState] = useState<any[] | undefined>(undefined);
  const [campos, setCampos] = useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
      title: 'Nombre del formulario',
      opciones: [],
    },
  ]);
  const [selectedForm, setSelectedForm] = useState<Campo[] | undefined>([]);
  const companyId = cookie.get('actualComp');
  const fetchForms = async () => {
    if (!companyId) return;
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.from('custom_form').select('*').eq('company_id', companyId);
    if (error) {
      console.log(error);
    }
    if (data) {
      setCreatedFormsState(data);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return (
    <div>
      <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup direction="horizontal" className="h-full max-h-[800px] items-stretch p-0 m-0">
          <ResizablePanel minSize={30}>
            <DisplayCreatedForms createdForms={createdFormsState} setSelectedForm={setSelectedForm} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="relative" minSize={30}>
            <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
            <FormDisplay
              campos={selectedForm ?? campos}
              selectedForm={selectedForm}
              setCampos={setCampos}
              fetchForms={fetchForms}
              created
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>
    </div>
  );
}

export default CreatedForm;
