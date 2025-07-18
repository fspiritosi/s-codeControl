import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, GraduationCap, Tag as TagIcon, Users } from 'lucide-react';
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

interface TrainingListProps {
  trainings: Awaited<ReturnType<typeof fetchTrainings>>;
  onDeleteClick: (id: string) => void;
  getMaterialIcon: (type: string) => JSX.Element;
  isDeleting: boolean;
  trainingToDelete: string | null;
  onViewEmployee: (id: string) => void;
  onManage: (id: string) => void;
}

export function TrainingList({
  trainings,
  onDeleteClick,
  getMaterialIcon,
  isDeleting,
  trainingToDelete,
  onViewEmployee,
  onManage,
}: TrainingListProps) {
  // Default to 'Borrador' if status is invalid

  return (
    <div className="divide-y rounded border">
      {trainings.map((training) => {
        const status = training.status === 'Publicado' || training.status === 'Borrador' ? training.status : 'Borrador';
        const tags = training.tags
          .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
          .map((tag) => ({
            ...tag,
            color: tag.color ?? undefined,
          }));
        return (
          <div key={training.id} className="flex items-center px-4 py-2 min-h-0">
            <div className="flex-1 min-w-0">
              {/* First row */}
              <div className="flex items-center gap-2 flex-wrap truncate">
                <GraduationCap className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="font-medium text-base truncate">{training.title}</span>
                <Badge variant={status === 'Publicado' ? 'default' : 'secondary'}>{status}</Badge>
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: tag?.color ? `${tag.color}20` : undefined,
                          borderColor: tag?.color ? `${tag.color}40` : undefined,
                          color: tag?.color ? tag.color : 'inherit',
                        }}
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag?.name}
                      </Badge>
                    ))}
                    {tags.length > 2 && tags[0]?.color && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: `${tags[0].color}20`,
                          borderColor: `${tags[0].color}40`,
                          color: tags[0].color,
                        }}
                      >
                        +{tags.length - 2} más
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Second row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {
                    Array.from(
                      new Set(training.attempts?.filter((attempt) => attempt.passed).map((a) => a.employee_id))
                    ).length
                  }
                  /{training.totalEmployees} completaron
                </span>

                {/* Progress bar */}
                <div className="w-20 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-purple-600 h-1 rounded-full"
                    style={{
                      width: `${(training.completedCount / training.totalEmployees) * 100}%`,
                      maxWidth: '100%',
                    }}
                  />
                </div>

                {/* Materials and evaluation info */}
                <div className="flex items-center gap-1">
                  {training.materials.length > 0 && (
                    <span>
                      {training.materials.length} material{training.materials.length !== 1 ? 'es' : ''}
                    </span>
                  )}

                  {training.evaluation?.questions && training.evaluation.questions.length > 0 ? (
                    <>
                      <span>•</span>
                      <span>
                        {training.evaluation.questions.length} pregunta
                        {training.evaluation.questions.length !== 1 ? 's' : ''}
                      </span>
                      {training.evaluation.passingScore !== undefined && training.evaluation.passingScore > 0 && (
                        <>
                          <span>•</span>
                          <span>Aprobación: {training.evaluation.passingScore}+</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>• Sin evaluación</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8" onClick={() => onManage(training.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => onViewEmployee(training.id)}>
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Empleado
                </Button>
              </div>

              {training.status === 'Borrador' && (
                <div className="flex items-center gap-1 border-l pl-2 ml-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={() => onDeleteClick(training.id)}
                    disabled={isDeleting && trainingToDelete === training.id}
                  >
                    {isDeleting && trainingToDelete === training.id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
