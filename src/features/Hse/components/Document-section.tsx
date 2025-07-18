'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Document } from '@/features/Hse/actions/documents';
import { DocumentUploadDialog } from '@/features/Hse/components/Document-upload-dialog';
import { supabaseBrowser } from '@/lib/supabase/browser';
import Cookies from 'js-cookie';
import { Calendar, Download, Eye, FileText, LayoutGrid, List, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
// Componente para la vista de cuadrícula
const DocumentGrid = ({
  documents,
  allTags,
  getStatusColor,
  getStatusText,
  formatDate,
  getEmployeeCounts,
  setDocumentToEdit,
  setEditDialogOpen,
  router,
  handleDownload,
  handlePublish,
  handleDelete,
  isLoading,
}: {
  documents: any[];
  allTags: any[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (dateStr: string | null | undefined) => string;
  getEmployeeCounts: (id: string) => { accepted: number; total: number };
  setDocumentToEdit: (doc: any) => void;
  setEditDialogOpen: (open: boolean) => void;
  router: any;
  handleDownload: (file_path: string, file_name: string) => void;
  handlePublish: (documentId: string) => void;
  handleDelete: (documentId: string, documentTitle: string) => void;
  isLoading: { [key: string]: boolean };
}) => (
  <div>
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <Badge className={getStatusColor(document.status)}>{getStatusText(document.status)}</Badge>
            </div>
            <CardTitle className="text-base sm:text-lg line-clamp-2">
              {document.docs_types?.short_description} - {document.title}
            </CardTitle>
            {document.tags && document.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {document.tags.map((tagName: string) => {
                  // Buscar el tag por nombre (case insensitive)
                  const tag = allTags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
                  const tagColor = tag?.color || '#6b7280'; // Color gris por defecto

                  return (
                    <Badge
                      key={tagName}
                      className="text-white hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: tagColor,
                        borderColor: tagColor,
                      }}
                    >
                      {tagName}
                    </Badge>
                  );
                })}
              </div>
            )}
            <CardDescription>Versión {document.version}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Fecha de creación: {formatDate(document.upload_date)}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                Fecha de vencimiento: {formatDate(document.expiry_date) || 'sin vencimiento'}
              </span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span>
                {getEmployeeCounts(document.id).accepted}/{getEmployeeCounts(document.id).total} empleados
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${((getEmployeeCounts(document.id).accepted || 0) / (getEmployeeCounts(document.id).total || 1)) * 100}%`,
                }}
              ></div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex flex-wrap gap-2">
                {document.status === 'borrador' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[100px]"
                    onClick={() => {
                      setDocumentToEdit(document);
                      setEditDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[100px]"
                  onClick={() => {
                    router.push(`/dashboard/hse/document/${document.id}/detail`);
                  }}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Ver Detalle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:w-auto"
                  onClick={() => handleDownload(document.file_path, document.file_name)}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              {document.status === 'borrador' && (
                <div className="flex gap-2 w-full">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handlePublish(document.id)}
                    disabled={isLoading[document.id]}
                  >
                    {isLoading[document.id] ? 'Publicando...' : 'Publicar'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(document.id, document.title)}
                    disabled={isLoading[document.id]}
                  >
                    {isLoading[document.id] ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Componente para la vista de lista
const DocumentList = ({
  documents,
  allTags,
  getStatusColor,
  getStatusText,
  formatDate,
  getEmployeeCounts,
  setDocumentToEdit,
  setEditDialogOpen,
  router,
  handleDownload,
  handlePublish,
  handleDelete,
  isLoading,
}: {
  documents: any[];
  allTags: any[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (dateStr: string | null | undefined) => string;
  getEmployeeCounts: (id: string) => { accepted: number; total: number };
  setDocumentToEdit: (doc: any) => void;
  setEditDialogOpen: (open: boolean) => void;
  router: any;
  handleDownload: (file_path: string, file_name: string) => void;
  handlePublish: (documentId: string) => void;
  handleDelete: (documentId: string, documentTitle: string) => void;
  isLoading: { [key: string]: boolean };
}) => (
  <div className="divide-y rounded border">
    {documents.map((doc) => (
      <div key={doc.id} className="flex items-center px-4 py-2 min-h-0">
        <div className="flex-1 min-w-0">
          {/* Primer renglón */}
          <div className="flex items-center gap-2 flex-wrap truncate">
            <span className="font-medium text-base truncate">{doc.docs_types?.short_description} - {doc.title}</span>
            <Badge className={getStatusColor(doc.status)}>{getStatusText(doc.status)}</Badge>
            <span className="text-xs text-muted-foreground">Versión {doc.version}</span>
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {doc.tags.map((tagName: string) => {
                  const tag = allTags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
                  const tagColor = tag?.color || '#6b7280';

                  return (
                    <Badge
                      key={tagName}
                      className="text-white hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: tagColor,
                        borderColor: tagColor,
                      }}
                    >
                      {tagName}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
          {/* Segundo renglón */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
            <span>Fecha de creación: {formatDate(doc.upload_date)}</span>
            <span>Fecha de vencimiento: {formatDate(doc.expiry_date) || 'sin vencimiento'}</span>
            <span className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {getEmployeeCounts(doc.id).accepted}/{getEmployeeCounts(doc.id).total} empleados
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-1 ml-2">
              <div
                className="bg-blue-600 h-1 rounded-full"
                style={{
                  width: `${((getEmployeeCounts(doc.id).accepted || 0) / (getEmployeeCounts(doc.id).total || 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
        {/* Acciones */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {doc.status === 'borrador' && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  setDocumentToEdit(doc);
                  setEditDialogOpen(true);
                }}
                disabled={isLoading[doc.id]}
              >
                Editar
              </Button>
            )}
            <Button
              onClick={() => router.push(`/dashboard/hse/document/${doc.id}/detail`)}
              size="sm"
              variant="ghost"
              className="h-8"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button
              onClick={() => handleDownload(doc.file_path, doc.file_name)}
              size="sm"
              variant="ghost"
              className="h-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {doc.status === 'borrador' && (
            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <Button
                variant="default"
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700"
                onClick={() => handlePublish(doc.id)}
                disabled={isLoading[doc.id]}
              >
                {isLoading[doc.id] ? 'Publicando...' : 'Publicar'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={() => handleDelete(doc.id, doc.title)}
                disabled={isLoading[doc.id]}
              >
                {isLoading[doc.id] ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

interface DocumentsSectionProps {
  initialDocuments: Document[];
  initialEmployees: any;
  allTags: { id: string; name: string; color: string | null }[]; // Aceptar string o null
  docTypes: any;
}

type EmployeeCounts = {
  total: number;
  accepted: number;
};

export function DocumentsSection({ initialDocuments, initialEmployees, allTags, docTypes }: DocumentsSectionProps) {
  const company_id = Cookies.get('actualComp');
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<any>(initialEmployees);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [sortBy, setSortBy] = useState<'upload_date' | 'title'>('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tab, setTab] = useState<'active' | 'expired' | 'drafts'>('active');
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);


  const getEmployeeCounts = (documentId: string): EmployeeCounts => {
    if (!employees || !Array.isArray(employees)) return { total: 0, accepted: 0 };
    const counts = employees.reduce(
      (acc: EmployeeCounts, employee: any) => {
        const hasDocument = employee.documents?.some((doc: any) => doc.document?.id === documentId);
        if (hasDocument) {
          acc.total += 1;
          const isAccepted = employee.documents?.some(
            (doc: any) => doc.document?.id === documentId && doc.status === 'aceptado'
          );
          if (isAccepted) acc.accepted += 1;
        }
        return acc;
      },
      { total: 0, accepted: 0 }
    );
    return counts;
  };

  /**
   * Obtiene los IDs de las posiciones únicas a las que está asignado un documento
   * @param documentId - ID del documento
   * @returns Array con los IDs de las posiciones únicas que tienen asignado el documento
   */
  const getDocumentAssignedPositions = (documentId: string): string[] => {
    if (!employees || !Array.isArray(employees)) {
      return [];
    }

    const positionSet = new Set<string>();
    let empleadosConDocumento = 0;

    employees.forEach((employee, index) => {
      const hasDocument = employee.documents?.some((doc: any) => doc.document?.id === documentId);

      if (hasDocument) {
        empleadosConDocumento++;

        if (employee.hierarchical_position && typeof employee.hierarchical_position === 'object') {
          positionSet.add(employee.company_position || employee.hierarchical_position.name);
        } else if (employee.position && typeof employee.position === 'string') {
          positionSet.add(employee.position);
        }
        // Si no tiene ninguna de las dos, mostramos un mensaje de depuración
        else {
          console.log(`Empleado ${index} tiene el documento pero no tiene posición definida o es inválida`, employee);
        }
      }
    });

    const posicionesUnicas = Array.from(positionSet);

    return posicionesUnicas;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'borrador':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Vigente';
      case 'expired':
        return 'Vencido';
      case 'pending':
        return 'Pendiente';
      case 'borrador':
        return 'Borrador';
      default:
        return status; // Return the status as is if not matched
    }
  };

  // Filtro y orden
  // const filterAndSortDocuments = (docs: Document[]) => {
  //   return docs
  //     .filter((doc) => {
  //       const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());

  //       // Si no hay etiquetas seleccionadas, mostrar todos los documentos que coincidan con la búsqueda
  //       if (selectedTags.length === 0) {
  //         return matchesSearch;
  //       }

  //       // Verificar si el documento tiene al menos una de las etiquetas seleccionadas
  //       const hasMatchingTag = doc.tags && doc.tags.some((tag) => selectedTags.includes(tag));

  //       return matchesSearch && hasMatchingTag;
  //     })
  //     .sort((a, b) => {
  //       if (sortBy === 'upload_date') {
  //         const dateA = new Date(a.upload_date).getTime();
  //         const dateB = new Date(b.upload_date).getTime();
  //         return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  //       } else {
  //         if (sortOrder === 'asc') {
  //           return a.title.localeCompare(b.title);
  //         } else {
  //           return b.title.localeCompare(a.title);
  //         }
  //       }
  //     });
  // };

  const filterAndSortDocuments = (docs: Document[]) => {
    return docs
      .filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTags =
          selectedTags.length === 0 || (doc.tags && doc.tags.some((tag) => selectedTags.includes(tag)));
        const matchesDocTypes =
          selectedDocTypes.length === 0 || (doc.docs_types && selectedDocTypes.includes(doc.docs_types.id));

        return matchesSearch && matchesTags && matchesDocTypes;
      })
      .sort((a, b) => {
        if (sortBy === 'upload_date') {
          const dateA = new Date(a.upload_date).getTime();
          const dateB = new Date(b.upload_date).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
        }
      });
  };
  // const filteredDocuments = useMemo(() => {
  //   return documents.filter(doc => {
  //     // Filtro por tags
  //     const matchesTags = selectedTags.length === 0 ||
  //       (doc.tags && selectedTags.some(tag => doc.tags?.includes(tag)));

  //     // Filtro por tipos de documento
  //     const matchesDocTypes = selectedDocTypes.length === 0 ||
  //       (doc.docs_types && selectedDocTypes.includes(doc.docs_types.id));

  //     return matchesTags && matchesDocTypes;
  //   });
  // }, [documents, selectedTags, selectedDocTypes]);
  const activeDocuments = documents.filter((doc) => doc.status === 'active');
  const draftDocuments = documents.filter((doc) => doc.status === 'borrador');
  const expiredDocuments = documents.filter((doc) => doc.status === 'expired');
  const currentTabDocuments =
    tab === 'active' ? activeDocuments : tab === 'drafts' ? draftDocuments : tab === 'expired' ? expiredDocuments : [];

  const handleDownload = async (file_path: string, file_name: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents-hse').download(file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el documento');
    }
  };

  // Estados para controlar los diálogos de confirmación
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; title?: string } | null>(null);

  const handlePublish = async (documentId: string) => {
    // Mostrar el diálogo de confirmación
    setSelectedDocument({ id: documentId });
    setPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    if (!selectedDocument) return;

    const documentId = selectedDocument.id;
    setIsLoading((prev) => ({ ...prev, [documentId]: true }));

    try {
      // Importar la server action directamente
      const { publishDocument } = await import('@/features/Hse/actions/documents');

      // Llamar a la server action
      const success = await publishDocument(documentId);

      if (!success) {
        throw new Error('No se pudo publicar el documento');
      }

      // Actualizar el estado local
      setDocuments((docs) => docs.map((doc) => (doc.id === documentId ? { ...doc, status: 'active' as const } : doc)));

      toast.success('Documento publicado correctamente');
    } catch (error) {
      console.error('Error al publicar el documento:', error);
      toast.error(error instanceof Error ? error.message : 'Error al publicar el documento');
    } finally {
      setIsLoading((prev) => ({ ...prev, [documentId]: false }));
      setPublishDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleDelete = (documentId: string, documentTitle: string) => {
    // Mostrar el diálogo de confirmación
    setSelectedDocument({ id: documentId, title: documentTitle });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    const documentId = selectedDocument.id;
    setIsLoading((prev) => ({ ...prev, [documentId]: true }));

    try {
      // Importar la server action directamente
      const { deleteDocument } = await import('@/features/Hse/actions/documents');

      // Llamar a la server action
      const result = await deleteDocument(documentId);

      if (result && !result.success) {
        throw new Error(result.message || 'Error al eliminar el documento');
      }

      // Actualizar el estado local
      setDocuments((docs) => docs.filter((doc) => doc.id !== documentId));

      toast.success('Documento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el documento');
    } finally {
      setIsLoading((prev) => ({ ...prev, [documentId]: false }));
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Error formateando fecha:', e);
      return 'Fecha inválida';
    }
  };
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Diálogo de confirmación para publicar */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas publicar este documento? No podrás editarlo después de publicarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} disabled={isLoading[selectedDocument?.id || '']}>
              {isLoading[selectedDocument?.id || ''] ? 'Publicando...' : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el documento {selectedDocument?.title}?
              <span className="text-destructive">Esta acción no se puede deshacer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading[selectedDocument?.id || '']}
            >
              {isLoading[selectedDocument?.id || ''] ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Tabs
        defaultValue="active"
        value={tab}
        onValueChange={(value: string) => {
          if (value === 'active' || value === 'expired' || value === 'drafts') {
            setTab(value);
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            Vigentes ({activeDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs sm:text-sm">
            Borradores ({draftDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs sm:text-sm">
            No Vigentes ({expiredDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Single dynamic TabsContent that works for all tabs */}
        <TabsContent value={tab} className="space-y-4">
          {/* Controles de filtro, orden, búsqueda y vista */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'upload_date' | 'title')}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload_date">Fecha de creación</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descendente</SelectItem>
                  <SelectItem value="asc">Ascendente</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-64">
                <MultiSelectCombobox
                  options={
                    allTags?.map((tag) => ({
                      label: tag.name,
                      value: tag.name,
                    })) || []
                  }
                  selectedValues={selectedTags}
                  placeholder="Filtrar por etiquetas"
                  emptyMessage="No hay etiquetas disponibles"
                  onChange={setSelectedTags}
                  showSelectAll
                />
              </div>
              <div className="w-64">
                <MultiSelectCombobox
                  options={
                    docTypes?.map((type: any) => ({
                      label: type.name,
                      value: type.id,
                      shortDescription: type.short_description,
                    })) || []
                  }
                  selectedValues={selectedDocTypes}
                  placeholder="Filtrar por tipo"
                  emptyMessage="No hay tipos disponibles"
                  onChange={setSelectedDocTypes}
                  showSelectAll
                />
              </div>
              <div className="relative group">
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="relative"
                >
                  {viewMode === 'grid' ? (
                    <List className="h-4 w-4 mr-1 hover:text-primary-foreground" />
                  ) : (
                    <LayoutGrid className="h-4 w-4 mr-1 hover:text-primary-foreground" />
                  )}
                </Button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Vista de {viewMode === 'grid' ? 'lista' : 'cuadrícula'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Renderizado según vista */}
          {filterAndSortDocuments(currentTabDocuments).length > 0 ? (
            viewMode === 'grid' ? (
              <DocumentGrid
                documents={filterAndSortDocuments(currentTabDocuments)}
                allTags={allTags}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                formatDate={formatDate}
                getEmployeeCounts={getEmployeeCounts}
                setDocumentToEdit={setDocumentToEdit}
                setEditDialogOpen={setEditDialogOpen}
                router={router}
                handleDownload={handleDownload}
                handlePublish={handlePublish}
                handleDelete={handleDelete}
                isLoading={isLoading}
              />
            ) : (
              <DocumentList
                documents={filterAndSortDocuments(currentTabDocuments)}
                allTags={allTags}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                formatDate={formatDate}
                getEmployeeCounts={getEmployeeCounts}
                setDocumentToEdit={setDocumentToEdit}
                setEditDialogOpen={setEditDialogOpen}
                router={router}
                handleDownload={handleDownload}
                handlePublish={handlePublish}
                handleDelete={handleDelete}
                isLoading={isLoading}
              />
            )
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {tab === 'active'
                  ? 'No hay documentos activos en este momento'
                  : tab === 'expired'
                    ? 'No hay documentos vencidos'
                    : 'No hay borradores'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {editDialogOpen && documentToEdit && (
        <DocumentUploadDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          initialData={{
            id: documentToEdit.id,
            docs_types: documentToEdit.docs_types?.id || '',
            title: documentToEdit.title,
            version: documentToEdit.version,
            description: documentToEdit.description || '',
            expiry_date: documentToEdit.expiry_date || undefined,
            file_path: documentToEdit.file_path,
            file_name: documentToEdit.file_name,
            file_type: documentToEdit.file_type,
            file_size: documentToEdit.file_size,
            typeOfEmployee: getDocumentAssignedPositions(documentToEdit.id),
            tags: documentToEdit.tags || [],
          }}
          documentId={documentToEdit.id}
          mode="edit"
          allTags={allTags}
        />
      )}
    </div>
  );
}
