import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditModal } from './EditDocumenTypeModal';
import { Button } from '@/components/ui/button';

interface DocumentsTableProps {
  data: any[];
  filters: {
    name: string;
    multiresource: string;
    special: string;
    monthly: string;
    expired: string;
    mandatory: string;
    private: string;
  };
  children: React.ReactNode;
  onToggleActive?: (doc: any, newState: boolean) => Promise<void> | void;
}

const DocumentsTable = ({ data, filters, children, onToggleActive }: DocumentsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        {children}
        {/* <TableHead className="w-[180px] text-center" align="center">Acciones</TableHead> */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((doc) => (
        <TableRow key={doc.id}>
          <TableCell>{doc.name}</TableCell>
          <TableCell className="text-center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
          <TableCell className="text-center">{doc.special ? 'Si' : 'No'}</TableCell>
          <TableCell className="text-center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
          <TableCell className="text-center">{doc.explired ? 'Si' : 'No'}</TableCell>
          <TableCell className="text-center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
          <TableCell className="text-center">{doc.private ? 'Si' : 'No'}</TableCell>
          <TableCell className="text-center">
            {doc.is_active ? (
              <span className="text-green-600">Activo</span>
            ) : (
              <span className="text-gray-500">Inactivo</span>
            )}
          </TableCell>
          <TableCell className="text-center">
            <div className="flex gap-2 justify-center">
              <EditModal Equipo={doc} />
              {onToggleActive && (
                <Button
                  variant={doc.is_active ? 'destructive' : 'success'}
                  onClick={() => onToggleActive(doc, !doc.is_active)}
                >
                  {doc.is_active ? 'Dar de baja' : 'Reactivar'}
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default DocumentsTable;
