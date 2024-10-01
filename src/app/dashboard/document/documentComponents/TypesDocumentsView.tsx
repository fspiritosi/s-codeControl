'use client';
import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountriesStore } from '@/store/countries';
import { useState } from 'react';
import DocumentsTable from './DocumentsTable'; // Asumo que este componente existe
import FilterHeader from './FilterComponent';

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

  const doc_personas = document_types?.filter((doc) => doc.applies === 'Persona').filter((e) => e.is_active);
  const doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos').filter((e) => e.is_active);
  const doc_empresa = document_types?.filter((doc) => doc.applies === 'Empresa').filter((e) => e.is_active);

  const [filters, setFilters] = useState({
    personas: { name: '', multiresource: '', special: '', monthly: '', expired: '', mandatory: '', private: '' },
    equipos: { name: '', multiresource: '', special: '', monthly: '', expired: '', mandatory: '', private: '' },
    empresa: { name: '', multiresource: '', special: '', monthly: '', expired: '', mandatory: '', private: '' },
  });

  const handleFilterChange = (type: 'personas' | 'equipos' | 'empresa', filterName: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: { ...prevFilters[type], [filterName]: value },
    }));
  };

  const applyFilters = (
    docs: typeof doc_personas | typeof doc_equipos | typeof doc_empresa,
    type: 'personas' | 'equipos' | 'empresa'
  ) => {
    const filter = filters[type];
    return docs?.filter((doc) => {
      const matchesName = doc.name.toLowerCase().includes(filter.name.toLowerCase());
      const matchesMultiresource =
        filter.multiresource === '' || (filter.multiresource === 'Si' ? doc.multiresource : !doc.multiresource);
      const matchesSpecial = filter.special === '' || (filter.special === 'Si' ? doc.special : !doc.special);
      const matchesMonthly =
        filter.monthly === '' || (filter.monthly === 'Si' ? doc.is_it_montlhy : !doc.is_it_montlhy);
      const matchesExpired = filter.expired === '' || (filter.expired === 'Si' ? doc.explired : !doc.explired);
      const matchesMandatory = filter.mandatory === '' || (filter.mandatory === 'Si' ? doc.mandatory : !doc.mandatory);
      const matchesPrivate = filter.private === '' || (filter.private === 'Si' ? doc.private : !doc.private);

      return (
        matchesName &&
        matchesMultiresource &&
        matchesSpecial &&
        matchesMonthly &&
        matchesExpired &&
        matchesMandatory &&
        matchesPrivate
      );
    });
  };

  const filteredDocPersonas = applyFilters(doc_personas, 'personas');
  const filteredDocEquipos = applyFilters(doc_equipos, 'equipos');
  const filteredDocEmpresa = applyFilters(doc_empresa, 'empresa');

  const convertToOptions = (array: (boolean | null | undefined)[]): string[] =>
    Array.from(new Set(array?.map((val) => (val === true ? 'Si' : 'No')))).filter((val) => val !== undefined);

  const docOptions = {
    multiresource: convertToOptions(document_types?.map((doc) => doc.multiresource)),
    special: convertToOptions(document_types?.map((doc) => doc.special)),
    monthly: convertToOptions(document_types?.map((doc) => doc.is_it_montlhy)),
    expired: convertToOptions(document_types?.map((doc) => doc.explired)),
    mandatory: convertToOptions(document_types?.map((doc) => doc.mandatory)),
    private: convertToOptions(document_types?.map((doc) => doc.private)),
  };

  const optionValue =
    personas && equipos && empresa ? 'Personas' : personas ? 'Personas' : equipos ? 'Equipos' : 'Empresa';

  return (
    <CardContent>
      <Tabs defaultValue={optionValue} className="w-full">
        <TabsList>
          {personas && <TabsTrigger value="Personas">Personas ({filteredDocPersonas?.length})</TabsTrigger>}
          {equipos && <TabsTrigger value="Equipos">Equipos ({filteredDocEquipos?.length})</TabsTrigger>}
          {empresa && <TabsTrigger value="Empresa">Empresa ({filteredDocEmpresa?.length})</TabsTrigger>}
        </TabsList>
        {personas && (
          <TabsContent value="Personas">
            <DocumentsTable data={filteredDocPersonas} filters={filters.personas}>
              <FilterHeader
                filters={filters.personas}
                docOptions={docOptions}
                onFilterChange={(name, value) => handleFilterChange('personas', name, value)}
              />
            </DocumentsTable>
          </TabsContent>
        )}
        {equipos && (
          <TabsContent value="Equipos">
            <DocumentsTable data={filteredDocEquipos} filters={filters.equipos}>
              <FilterHeader
                filters={filters.equipos}
                docOptions={docOptions}
                onFilterChange={(name, value) => handleFilterChange('equipos', name, value)}
              />
            </DocumentsTable>
          </TabsContent>
        )}
        {empresa && (
          <TabsContent value="Empresa">
            <DocumentsTable data={filteredDocEmpresa} filters={filters.empresa}>
              <FilterHeader
                filters={filters.empresa}
                docOptions={docOptions}
                onFilterChange={(name, value) => handleFilterChange('empresa', name, value)}
              />
            </DocumentsTable>
          </TabsContent>
        )}
      </Tabs>
    </CardContent>
  );
}

export default TypesDocumentsView;
