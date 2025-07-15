'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useEffect, useState } from 'react';
import { fetchAllHseDocTypes } from '../actions/documents';
import DocTypeForm from './DocTypeForm';
import DocTypeTable from './DocTypeTable';



function DocTypeTab() {
  const [selectedDocType, setSelectedDocType] = useState<Awaited<ReturnType<typeof fetchAllHseDocTypes>>[] | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [hse_doc_types, setHse_Doc_types] = useState<Awaited<ReturnType<typeof fetchAllHseDocTypes>>[]>([]);

  useEffect(()=>{
    async function fetchDocTypes() {
      const hse_doc_types = await fetchAllHseDocTypes();
      setHse_Doc_types(hse_doc_types);
    }
    fetchDocTypes();},[])
   
  
  return (
    <div>
      <ResizablePanelGroup direction="horizontal" className="min-h-[400px]">  
        <ResizablePanel defaultSize={40}>
          <DocTypeForm
            mode={mode}
            setMode={setMode}
            selectedDocType={selectedDocType}
            setSelectedDocType={setSelectedDocType}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <DocTypeTable hse_doc_types={hse_doc_types} selectedHse_Doc_type={selectedDocType} setSelectedHse_Doc_type={setSelectedDocType} setMode={setMode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
export default DocTypeTab;
