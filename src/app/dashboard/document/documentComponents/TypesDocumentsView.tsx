'use client';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { EditModal } from './EditDocumenTypeModal';

function TypesDocumentsView({
  personas,
  equipos,
  empresa,
}: {
  personas?: boolean;
  equipos?: boolean;
  empresa?: boolean;
}) {
  const document_types = useCountriesStore((state) => state.companyDocumentTypes);
  let doc_personas = document_types?.filter((doc) => doc.applies === 'Persona').filter((e) => e.is_active);
  let doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos').filter((e) => e.is_active);
  let doc_empresa = document_types?.filter((doc) => doc.applies === 'Empresa').filter((e) => e.is_active);

  //condicion para mostrar el tab seleccionado por defecto
  const optionValue =
    personas && equipos && empresa ? 'Personas' : personas ? 'Personas' : equipos ? 'Equipos' : 'Empresa';
  const optionChildrenProp =
    personas && equipos && empresa ? 'all' : personas ? 'Personas' : equipos ? 'Equipos' : 'Empresa';
  return (
    <CardContent>
      <Tabs defaultValue={optionValue} className="w-full">
        <TabsList>
          {personas && <TabsTrigger value="Personas">Personas</TabsTrigger>}
          {equipos && <TabsTrigger value="Equipos">Equipos</TabsTrigger>}
          {empresa && <TabsTrigger value="Empresa">Empresa</TabsTrigger>}
        </TabsList>
        <TabsContent value="Personas">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Documento</TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Multirecurso
                </TableHead>
                <TableHead className="w-[130px] text-center" align="center">
                  Es especial?
                </TableHead>
                <TableHead className="w-[130px] text-center" align="center">
                  Es mensual?
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Vence
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Mandatorio
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Es privado?
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Editar
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doc_personas
                ?.sort((a, b) => {
                  if (a.company_id === null && b.company_id !== null) {
                    return -1;
                  } else if (a.company_id !== null && b.company_id === null) {
                    return 1;
                  } else {
                    return a.name.localeCompare(b.name);
                  }
                })
                ?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.special ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.private ? 'Si' : 'No'}</TableCell>
                    {doc.company_id && (
                      <TableCell align="center">
                        <EditModal Equipo={doc} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="Equipos">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Documento</TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Multirecurso
                </TableHead>
                <TableHead className="w-[130px] text-center" align="center">
                  Es especial?
                </TableHead>
                <TableHead className="w-[130px] text-center" align="center">
                  Es mensual?
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Vence
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Mandatorio
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Es privado?
                </TableHead>
                <TableHead className="w-[100px] text-center" align="center">
                  Editar
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doc_equipos
                ?.sort((a, b) => {
                  if (a.company_id === null && b.company_id !== null) {
                    return -1;
                  } else if (a.company_id !== null && b.company_id === null) {
                    return 1;
                  } else {
                    return a.name.localeCompare(b.name);
                  }
                })
                ?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.special ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.private ? 'Si' : 'No'}</TableCell>
                    {doc.company_id && (
                      <TableCell align="center">
                        <EditModal Equipo={doc} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="Empresa">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Documento</TableHead>
                <TableHead className="w-[100px] text-center">Vence</TableHead>
                <TableHead className="w-[130px] text-center">Es mensual?</TableHead>
                <TableHead className="w-[100px] text-center">Es privado?</TableHead>
                <TableHead className="w-[100px] text-center">Mandatorio</TableHead>
                <TableHead className="w-[100px] text-center">Editar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doc_empresa?.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
                  <TableCell align="center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
                  <TableCell align="center">{doc.private ? 'Si' : 'No'}</TableCell>
                  <TableCell align="center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
                  {doc.company_id && (
                    <TableCell align="center">
                      <EditModal Equipo={doc} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </CardContent>
  );
}

export default TypesDocumentsView;
