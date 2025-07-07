'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Document } from '@/features/Hse/actions/documents'; // <-- ¡SÍ!
import { supabaseBrowser } from '@/lib/supabase/browser';
import Cookies from 'js-cookie';
import { Calendar, Download, Eye, FileText, LayoutGrid, List, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {DocumentUploadDialog} from '@/features/Hse/components/Document-upload-dialog';

interface DocumentsSectionProps {
  initialDocuments: Document[];
  initialEmployees: any;
  allTags: { id: string; name: string; color: string | null }[]; // Aceptar string o null
}

type EmployeeCounts = {
  total: number;
  accepted: number;
};

export function DocumentsSection({ initialDocuments, initialEmployees, allTags }: DocumentsSectionProps) {
  const company_id = Cookies.get('actualComp');
  const supabase = supabaseBrowser();
  const router = useRouter();
console.log(allTags);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<any>(initialEmployees);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  // Nuevos estados para filtros y vista
  const [sortBy, setSortBy] = useState<'upload_date' | 'title'>('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [tab, setTab] = useState<'active' | 'expired'>('active');
  console.log(initialEmployees);
  // Helpers originales
  const getEmployeeCounts = (documentId: string): EmployeeCounts => {
    if (!employees || !Array.isArray(employees)) return { total: 0, accepted: 0 };
    const counts = employees.reduce(
      (acc: EmployeeCounts, employee: any) => {
        const hasDocument = employee.documents?.some((doc: any) => doc.document?.id === documentId);
        if (hasDocument) {
          acc.total += 1;
          const isAccepted = employee.documents?.some(
            (doc: any) => doc.document?.id === documentId && doc.status === 'accepted'
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
      console.log('No hay empleados o no es un array');
      return [];
    }

    console.log('Buscando posiciones para el documento:', documentId);
    console.log('Total de empleados a procesar:', employees.length);
    
    const positionSet = new Set<string>();
    let empleadosConDocumento = 0;

    employees.forEach((employee, index) => {
      const hasDocument = employee.documents?.some(
        (doc: any) => doc.document?.id === documentId
      );
      
      if (hasDocument) {
        empleadosConDocumento++;
        // Verificamos si el empleado tiene company_position
        if (employee.hierarchical_position && typeof employee.hierarchical_position === 'object') {
          console.log(`Empleado ${index} tiene el documento y posición:`, employee.company_position);
          positionSet.add(employee.company_position);
        } 
        // Si no tiene company_position, verificamos si tiene position (string)
        else if (employee.position && typeof employee.position === 'string') {
          console.log(`Empleado ${index} tiene el documento y posición (string):`, employee.position);
          positionSet.add(employee.position);
        } 
        // Si no tiene ninguna de las dos, mostramos un mensaje de depuración
        else {
          console.log(`Empleado ${index} tiene el documento pero no tiene posición definida o es inválida`, employee);
        }
      }
    });

    console.log(`Total de empleados con el documento: ${empleadosConDocumento}`);
    const posicionesUnicas = Array.from(positionSet);
    console.log('Posiciones únicas encontradas:', posicionesUnicas);
    
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
      default:
        return 'Desconocido';
    }
  };

  // Filtro y orden
  const filterAndSortDocuments = (docs: Document[]) => {
    return docs
      .filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = tagFilter === 'all' || (doc.tags && doc.tags.includes(tagFilter));
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'upload_date') {
          const dateA = new Date(a.upload_date).getTime();
          const dateB = new Date(b.upload_date).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          if (sortOrder === 'asc') {
            return a.title.localeCompare(b.title);
          } else {
            return b.title.localeCompare(a.title);
          }
        }
      });
  };

  const activeDocuments = documents.filter((doc) => doc.status === 'active');
  const expiredDocuments = documents.filter((doc) => doc.status === 'expired');
  const currentTabDocuments = tab === 'active' ? activeDocuments : expiredDocuments;

  const handleDownload = (file_path: string, file_name: string) => {
    try {
      const doc = window.document;
      const link = doc.createElement('a');
      link.href = file_path;
      link.download = file_name;
      doc.body.appendChild(link);
      link.click();
      doc.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      toast.error('Error al descargar el archivo');
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
console.log(documents);
  const DocumentGrid = ({ documents }: { documents: Document[] }) => (
    <div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <Badge className={getStatusColor(document.status)}>{getStatusText(document.status)}</Badge>
              </div>
              <CardTitle className="text-base sm:text-lg line-clamp-2">{document.title}</CardTitle>
              {document.tags && document.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {document.tags.map((tagName) => {
                    // Buscar el tag por nombre (case insensitive)
                    const tag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    const tagColor = tag?.color || '#6b7280'; // Color gris por defecto
                    
                    return (
                      <Badge 
                        key={tagName}
                        className="text-white hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: tagColor,
                          borderColor: tagColor
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
                <span className="truncate">Fecha de vencimiento: {formatDate(document.expiry_date) || 'sin vencimiento'}</span>
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
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDocumentToEdit(document); // documento es el objeto actual del map
                    setEditDialogOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs sm:text-sm"
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Vista de lista
  const DocumentList = ({ documents }: { documents: Document[] }) => (
    <div className="divide-y rounded border">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center px-4 py-2 min-h-0">
          <div className="flex-1 min-w-0">
            {/* Primer renglón */}
            <div className="flex items-center gap-2 flex-wrap truncate">
              <span className="font-medium text-base truncate">{doc.title}</span>
              <Badge className={getStatusColor(doc.status)}>{getStatusText(doc.status)}</Badge>
              <span className="text-xs text-muted-foreground">Versión {doc.version}</span>
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {doc.tags.map((tagName) => {
                    const tag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    const tagColor = tag?.color || '#6b7280';
                    
                    return (
                      <Badge 
                        key={tagName}
                        className="text-white hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: tagColor,
                          borderColor: tagColor
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
          <div className="flex items-center ml-2 gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDocumentToEdit(doc); // documento es el objeto actual del map
                setEditDialogOpen(true);
              }}
            >
              Editar
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/hse/document/${doc.id}/detail`)}
              size="sm"
              variant="outline"
              className="mr-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalle
            </Button>
            <Button onClick={() => handleDownload(doc.file_path, doc.file_name)} size="sm" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs
        defaultValue="active"
        value={tab}
        onValueChange={(v) => setTab(v as 'active' | 'expired')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            Vigentes ({activeDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs sm:text-sm">
            No Vigentes ({expiredDocuments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Controles de filtro, orden, búsqueda y vista */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {allTags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'upload_date' | 'title')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload_date">Fecha de creación</SelectItem>
                <SelectItem value="title">Título</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descendente</SelectItem>
                <SelectItem value="asc">Ascendente</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              {viewMode === 'grid' ? (
                <>
                  <List className="h-4 w-4 mr-1" /> Vista de lista
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-1" /> Vista de grid
                </>
              )}
            </Button>
          </div>
          {/* Renderizado según vista */}
          {filterAndSortDocuments(activeDocuments).length > 0 ? (
            viewMode === 'grid' ? (
              <DocumentGrid documents={filterAndSortDocuments(activeDocuments)} />
            ) : (
              <DocumentList documents={filterAndSortDocuments(activeDocuments)} />
            )
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay documentos vigentes</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {/* Controles de filtro, orden, búsqueda y vista */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {allTags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'upload_date' | 'title')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload_date">Fecha de creación</SelectItem>
                <SelectItem value="title">Título</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descendente</SelectItem>
                <SelectItem value="asc">Ascendente</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              {viewMode === 'grid' ? (
                <>
                  <List className="h-4 w-4 mr-1" /> Vista de lista
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-1" /> Vista de grid
                </>
              )}
            </Button>
          </div>
          {/* Renderizado según vista */}
          {filterAndSortDocuments(expiredDocuments).length > 0 ? (
            viewMode === 'grid' ? (
              <DocumentGrid documents={filterAndSortDocuments(expiredDocuments)} />
            ) : (
              <DocumentList documents={filterAndSortDocuments(expiredDocuments)} />
            )
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay documentos vencidos</p>
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
