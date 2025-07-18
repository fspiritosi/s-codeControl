import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, GraduationCap, Tag as TagIcon, Trash2, Users } from 'lucide-react';
import { fetchTrainings } from '../actions/actions';

interface TrainingMaterial {
  type: string;
  name: string;
  url: string;
  file_url?: string;
  file_size?: number;
  order?: number;
  is_required?: boolean;
}

interface TrainingTag {
  id: string;
  name: string;
  color?: string;
}

interface TrainingEvaluation {
  questions: any[];
  passingScore?: number;
}

interface Training {
  id: string;
  title: string;
  description: string;
  status: 'Publicado' | 'Borrador';
  tags: TrainingTag[];
  completedCount: number;
  totalEmployees: number;
  materials: TrainingMaterial[];
  evaluation?: TrainingEvaluation;
}

interface TrainingGridProps {
  trainings: Awaited<ReturnType<typeof fetchTrainings>>;
  onDeleteClick: (id: string) => void;
  getMaterialIcon: (type: string) => JSX.Element;
  isDeleting: boolean;
  trainingToDelete: string | null;
  onViewEmployee: (id: string) => void;
  onManage: (id: string) => void;
}

export function TrainingGrid({
  trainings,
  onDeleteClick,
  getMaterialIcon,
  isDeleting,
  trainingToDelete,
  onViewEmployee,
  onManage,
}: TrainingGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {trainings.map((training) => {
        const status = training.status; // Default to 'Borrador' if status is invalid
        const tags = training.tags
          .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
          .map((tag) => ({
            ...tag,
            color: tag.color ?? undefined,
          }));

        return (
          <Card key={training.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <Badge variant={status === 'Publicado' ? 'default' : status === 'Borrador' ? 'outline' : 'destructive'}>
                  {status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{training.title}</CardTitle>
              <CardDescription className="line-clamp-2">{training.description}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                    style={{ backgroundColor: tag?.color || '#ccc' }}
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag?.name}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                {
                  Array.from(new Set(training.attempts?.filter((attempt) => attempt.passed).map((a) => a.employee_id)))
                    .length
                }
                /{training.totalEmployees} completaron
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(training.completedCount / training.totalEmployees) * 100}%` }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Materiales:</p>
                <div className="flex gap-1 flex-wrap">
                  {training.materials.map((material: TrainingMaterial, index: number) => (
                    <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                      {getMaterialIcon(material.type)}
                      <span>{material.type.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {training.evaluation && training.evaluation.questions && training.evaluation.questions.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Evaluación: {training.evaluation.questions.length} preguntas
                  {training.evaluation.passingScore && training.evaluation.passingScore > 0 && (
                    <> (mín. {training.evaluation.passingScore} correctas)</>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onManage(training.id)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Administrar
                  </Button>

                  <Button variant="default" size="sm" className="flex-1" onClick={() => onViewEmployee(training.id)}>
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Vista Empleado
                  </Button>
                </div>

                {training.status === 'Borrador' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteClick(training.id)}
                    disabled={isDeleting && trainingToDelete === training.id}
                  >
                    {isDeleting && trainingToDelete === training.id ? (
                      'Eliminando...'
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
