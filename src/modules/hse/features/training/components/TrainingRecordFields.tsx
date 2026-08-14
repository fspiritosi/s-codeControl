'use client';

import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createTrainingInstructor } from '../actions.server';
import {
  TRAINING_EVALUATION_METHODS,
  TRAINING_TOPICS,
  type TrainingEvaluationMethod,
  type TrainingRecordData,
  type TrainingTopic,
} from '../shared/record-fields';

type Instructor = {
  id: string;
  full_name: string;
  position: string | null;
};

/**
 * Alta rápida de capacitador desde el propio formulario, para no obligar a salir
 * a una pantalla de configuración.
 *
 * TODO (tsk-540): falta la carga de la firma escaneada. El cliente todavía no
 * envió la del Lic. Gutiérrez; hasta entonces la planilla sale sin firma del
 * capacitador.
 */
function NewInstructorDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (instructor: Instructor) => void;
}) {
  const [data, setData] = useState({ full_name: '', position: '', license_numbers: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await createTrainingInstructor(data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Capacitador creado');
      onCreated({
        id: result.data.id,
        full_name: result.data.full_name,
        position: result.data.position,
      });
      setData({ full_name: '', position: '', license_numbers: '' });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nuevo capacitador</DialogTitle>
          <DialogDescription>Sus datos figuran en la planilla de registro de capacitación.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructor_full_name">Nombre y apellido</Label>
            <Input
              id="instructor_full_name"
              value={data.full_name}
              onChange={(e) => setData({ ...data, full_name: e.target.value })}
              placeholder="Ej: Lic. Lucas Gutiérrez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructor_position">Cargo</Label>
            <Input
              id="instructor_position"
              value={data.position}
              onChange={(e) => setData({ ...data, position: e.target.value })}
              placeholder="Ej: Hig. y Seg. en el Trabajo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructor_licenses">Matrículas</Label>
            <Input
              id="instructor_licenses"
              value={data.license_numbers}
              onChange={(e) => setData({ ...data, license_numbers: e.target.value })}
              placeholder="Ej: Mat. CINQN PA-0076 / Mat. CPIT A-4365-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || !data.full_name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Crear capacitador'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Campos del acta de registro de capacitación (tsk-540). Se comparten entre el
 * diálogo de creación y el de edición.
 *
 * `showHseFields` controla los dos campos que carga el referente de HSE una vez
 * dictada la capacitación (eficacia y nuevas acciones): no tiene sentido
 * pedirlos al crearla.
 */
export function TrainingRecordFields({
  value,
  onChange,
  instructors,
  showHseFields = false,
}: {
  value: TrainingRecordData;
  onChange: (next: TrainingRecordData) => void;
  instructors: Instructor[];
  showHseFields?: boolean;
}) {
  // Los recién creados se agregan acá para que aparezcan en el select sin
  // recargar el formulario.
  const [createdInstructors, setCreatedInstructors] = useState<Instructor[]>([]);
  const [isNewInstructorOpen, setIsNewInstructorOpen] = useState(false);
  const allInstructors = [...instructors, ...createdInstructors];

  const set = <K extends keyof TrainingRecordData>(key: K, next: TrainingRecordData[K]) =>
    onChange({ ...value, [key]: next });

  const toggleTopic = (topic: TrainingTopic, checked: boolean) =>
    set('topics', checked ? [...value.topics, topic] : value.topics.filter((t) => t !== topic));

  const toggleMethod = (method: TrainingEvaluationMethod, checked: boolean) =>
    set(
      'evaluation_methods',
      checked ? [...value.evaluation_methods, method] : value.evaluation_methods.filter((m) => m !== method)
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dictated_at">Fecha en que se dicta</Label>
          <Input
            id="dictated_at"
            type="date"
            value={value.dictated_at ?? ''}
            onChange={(e) => set('dictated_at', e.target.value || null)}
          />
          <p className="text-sm text-muted-foreground">Define el mes al que corresponde la capacitación.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline_at">Fecha límite de realización</Label>
          <Input
            id="deadline_at"
            type="date"
            value={value.deadline_at ?? ''}
            min={value.dictated_at ?? undefined}
            onChange={(e) => set('deadline_at', e.target.value || null)}
          />
          <p className="text-sm text-muted-foreground">
            Hasta esa fecha los empleados pueden realizarla. Después se cierra y el registro queda definitivo.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Lugar</Label>
          <Input
            id="location"
            value={value.location ?? ''}
            onChange={(e) => set('location', e.target.value || null)}
            placeholder="Capacitación Online"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor">Capacitador</Label>
          <div className="flex gap-2">
            <Select value={value.instructor_id ?? ''} onValueChange={(v) => set('instructor_id', v || null)}>
              <SelectTrigger id="instructor">
                <SelectValue placeholder="Seleccionar capacitador" />
              </SelectTrigger>
              <SelectContent>
                {allInstructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                    {instructor.position ? ` — ${instructor.position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Nuevo capacitador"
              onClick={() => setIsNewInstructorOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {allInstructors.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay capacitadores cargados.</p>
          )}
        </div>

        <NewInstructorDialog
          open={isNewInstructorOpen}
          onOpenChange={setIsNewInstructorOpen}
          onCreated={(instructor) => {
            setCreatedInstructors((prev) => [...prev, instructor]);
            set('instructor_id', instructor.id);
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="estimated_duration_minutes">Duración estimada (minutos)</Label>
          <Input
            id="estimated_duration_minutes"
            type="number"
            min={1}
            value={value.estimated_duration_minutes ?? ''}
            onChange={(e) => set('estimated_duration_minutes', e.target.value ? Number(e.target.value) : null)}
            placeholder="Ej: 80"
          />
          <p className="text-sm text-muted-foreground">
            Es la duración que declara el capacitador, no el límite de tiempo del cuestionario.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Temas incluidos</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TRAINING_TOPICS.map((topic) => (
            <label key={topic.value} className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                checked={value.topics.includes(topic.value)}
                onCheckedChange={(checked) => toggleTopic(topic.value, checked === true)}
              />
              {topic.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="teaching_resources">Recursos didácticos utilizados</Label>
        <Input
          id="teaching_resources"
          value={value.teaching_resources ?? ''}
          onChange={(e) => set('teaching_resources', e.target.value || null)}
          placeholder="Ej: Capacitación online, PDF"
        />
      </div>

      <div className="space-y-2">
        <Label>Material escrito / digital entregado</Label>
        <RadioGroup
          className="flex gap-6"
          value={value.material_delivered === null ? '' : value.material_delivered ? 'si' : 'no'}
          onValueChange={(v) => set('material_delivered', v === 'si')}
        >
          <label className="flex items-center gap-2 text-sm font-normal">
            <RadioGroupItem value="si" /> Sí
          </label>
          <label className="flex items-center gap-2 text-sm font-normal">
            <RadioGroupItem value="no" /> No
          </label>
        </RadioGroup>
        {value.material_delivered && (
          <Input
            value={value.material_delivered_detail ?? ''}
            onChange={(e) => set('material_delivered_detail', e.target.value || null)}
            placeholder="¿Cuál?"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de evaluación</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TRAINING_EVALUATION_METHODS.map((method) => (
            <label key={method.value} className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                checked={value.evaluation_methods.includes(method.value)}
                onCheckedChange={(checked) => toggleMethod(method.value, checked === true)}
              />
              {method.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validity_months">Vigencia (meses)</Label>
        <Input
          id="validity_months"
          type="number"
          min={1}
          value={value.validity_months ?? ''}
          onChange={(e) => set('validity_months', e.target.value ? Number(e.target.value) : null)}
          placeholder="Ej: 12"
        />
        <p className="text-sm text-muted-foreground">Vacío significa que la capacitación no vence.</p>
      </div>

      {showHseFields && (
        <div className="space-y-6 rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            Estos campos los completa el referente de HSE una vez dictada la capacitación. Son necesarios para
            descargar la planilla de registro.
          </p>

          <div className="space-y-2">
            <Label htmlFor="effectiveness_method">Método de evaluación de la eficacia</Label>
            <Textarea
              id="effectiveness_method"
              rows={2}
              value={value.effectiveness_method ?? ''}
              onChange={(e) => set('effectiveness_method', e.target.value || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>¿Se requieren nuevas acciones?</Label>
            <RadioGroup
              className="flex gap-6"
              value={value.requires_new_actions === null ? '' : value.requires_new_actions ? 'si' : 'no'}
              onValueChange={(v) => set('requires_new_actions', v === 'si')}
            >
              <label className="flex items-center gap-2 text-sm font-normal">
                <RadioGroupItem value="si" /> Sí
              </label>
              <label className="flex items-center gap-2 text-sm font-normal">
                <RadioGroupItem value="no" /> No
              </label>
            </RadioGroup>
            {value.requires_new_actions && (
              <Textarea
                rows={2}
                value={value.new_actions_detail ?? ''}
                onChange={(e) => set('new_actions_detail', e.target.value || null)}
                placeholder="Indicar cuáles"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
