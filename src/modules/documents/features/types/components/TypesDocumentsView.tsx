import { DocumentTypeList } from './DocumentTypeList';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

interface Props {
  searchParams?: DataTableSearchParams;
  personas?: boolean;
  equipos?: boolean;
  empresa?: boolean;
}

export default function TypesDocumentsView({ searchParams = {}, personas, equipos, empresa }: Props) {
  const appliesFilter = personas && !equipos && !empresa
    ? 'Persona'
    : equipos && !personas && !empresa
      ? 'Equipos'
      : empresa && !personas && !equipos
        ? 'Empresa'
        : undefined;

  return <DocumentTypeList searchParams={searchParams} appliesFilter={appliesFilter} />;
}
