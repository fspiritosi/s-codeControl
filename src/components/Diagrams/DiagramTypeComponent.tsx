'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Button } from '@/components/ui/button';

import { useEffect, useState } from 'react';
import { DiagramNewTypeForm } from './DiagramNewTypeForm';

import BtnXlsDownload from '../BtnXlsDownload';

function DiagramTypeComponent({ diagrams_types }: { diagrams_types: DiagramType[] }) {
  const [selectDiagramType, setSelectDiagramType] = useState<{}>({});

  function setDiagram(data: any) {
    setSelectDiagramType(data);
  }

  function createDataToDownload(data: any) {
    const dataToDownload = data.map((dato: any) => ({
      nombre: dato.name,
      color: dato.color,
      descCorta: dato.short_description,
      labActivo: dato.work_active ? 'Trabajando' : 'No trabajando',
    }));
    return dataToDownload;
  }

  useEffect(() => {
    setSelectDiagramType({});
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6">
      <ResizablePanel>
        <DiagramNewTypeForm selectedDiagram={selectDiagramType} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-6 min-w-[600px]" defaultSize={70}>
        <Table>
          <TableCaption>Lista de novedades de diagrama</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre de la Novedad</TableHead>
              <TableHead className="w-[100px]">Color</TableHead>
              <TableHead>Descripción Corta</TableHead>
              <TableHead>Vista Previa</TableHead>
              <TableHead>Lab. Activa</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagrams_types.map((diagramType: any) => (
              <TableRow key={diagramType.name}>
                <TableCell>{diagramType.name}</TableCell>

                <TableCell>
                  <div className={`rounded-full w-5 h-5 border`} style={{ backgroundColor: diagramType.color }}></div>
                </TableCell>
                <TableCell>{diagramType.short_description}</TableCell>
                <TableCell>
                  <div
                    className="w-10 h-10 flex justify-center items-center"
                    style={{ backgroundColor: diagramType.color }}
                  >
                    {diagramType.short_description}
                  </div>
                </TableCell>
                <TableCell>{diagramType.work_active ? 'Si' : 'No'}</TableCell>
                <TableCell>
                  <Button
                    size={'sm'}
                    variant={'link'}
                    className="hover:text-blue-400"
                    onClick={() => setDiagram(diagramType)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <BtnXlsDownload fn={createDataToDownload} dataToDownload={diagrams_types} nameFile={'Tipos_de_Diagrama'} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default DiagramTypeComponent;
