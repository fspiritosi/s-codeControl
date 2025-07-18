'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useEffect, useState } from 'react';
import { fetchAllHseDocTypes } from '../actions/documents';
import DocTypeForm from './DocTypeForm';
import DocTypeTable from './DocTypeTable';
import Cookies from 'js-cookie';

interface DocTypeTabProps {
docs_types: any[];
}



function DocTypeTab({docs_types}: DocTypeTabProps) {
  const [selectedDocType, setSelectedDocType] = useState<Awaited<ReturnType<typeof fetchAllHseDocTypes>>[number] | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  // const [hse_doc_types, setHse_Doc_types] = useState<Awaited<ReturnType<typeof fetchAllHseDocTypes>>>([]);
  
  const companyId = Cookies.get('actualComp');
  
  // useEffect(()=>{
  //   async function fetchDocTypes() {
  //     const hse_doc_types = await fetchAllHseDocTypes(companyId as string);
  //     setHse_Doc_types(hse_doc_types);
  //   }
  //   fetchDocTypes();},[])
   
  
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
          <DocTypeTable hse_doc_types={docs_types} selectedHse_Doc_type={selectedDocType} setSelectedHse_Doc_type={setSelectedDocType} setMode={setMode} mode={mode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
export default DocTypeTab;
