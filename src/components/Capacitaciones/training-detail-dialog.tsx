'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TrainingCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrainingCreated: (training: any) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export function TrainingCreateDialog() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materials: [] as Array<{ type: string; file: File | null; name: string }>,
    questions: [] as Question[],
    passingScore: 0,
  });

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { type: 'pdf', file: null, name: '' }],
    });
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData({ ...formData, materials: newMaterials });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      options: ['', ''],
      correctAnswer: 0,
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions: any = [...formData.questions];
    if (field === 'options') {
      newQuestions[index].options = value;
    } else {
      newQuestions[index][field as keyof Question] = value;
    }
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = () => {
    const newTraining = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      createdDate: new Date().toISOString().split('T')[0],
      materials: formData.materials.map((m) => ({
        type: m.type,
        name: m.file?.name || m.name,
        url: `/materials/${m.file?.name || 'file'}`,
      })),
      evaluation: {
        questions: formData.questions.length,
        passingScore: formData.passingScore,
      },
      completedCount: 0,
      totalEmployees: 60,
      status: 'active' as const,
    };

    // onTrainingCreated(newTraining);

    // Reset form
    setFormData({
      title: '',
      description: '',
      materials: [],
      questions: [],
      passingScore: 0,
    });
  };

  return (
    <Dialog>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Capacitación</DialogTitle>
          <DialogDescription>Crea una nueva capacitación con materiales y evaluación</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Información</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluación</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Capacitación</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Seguridad en Carretera"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el contenido de la capacitación..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Materiales de Capacitación</h3>
              <Button onClick={addMaterial} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Material
              </Button>
            </div>

            <div className="space-y-3">
              {formData.materials.map((material, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Tipo de Material</Label>
                        <Select
                          value={material.type}
                          onValueChange={(value) => {
                            const newMaterials = [...formData.materials];
                            newMaterials[index].type = value;
                            setFormData({ ...formData, materials: newMaterials });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="ppt">PowerPoint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-2">
                        <Label>Archivo</Label>
                        <Input
                          type="file"
                          accept={
                            material.type === 'pdf'
                              ? '.pdf'
                              : material.type === 'video'
                                ? '.mp4,.avi,.mov'
                                : '.ppt,.pptx'
                          }
                          onChange={(e) => {
                            const newMaterials = [...formData.materials];
                            newMaterials[index].file = e.target.files?.[0] || null;
                            setFormData({ ...formData, materials: newMaterials });
                          }}
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Evaluación</h3>
              <Button onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Pregunta
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Puntaje Mínimo para Aprobar</Label>
              <Input
                id="passingScore"
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: Number.parseInt(e.target.value) || 0 })}
                placeholder="Ej: 8"
                max={formData.questions.length}
              />
              <p className="text-sm text-muted-foreground">De {formData.questions.length} preguntas totales</p>
            </div>

            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Pregunta {index + 1}</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => removeQuestion(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Pregunta</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        placeholder="Escribe la pregunta..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Opciones de Respuesta</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (question.options.length < 6) {
                                const newOptions = [...question.options, ''];
                                updateQuestion(index, 'options', newOptions);
                              }
                            }}
                            disabled={question.options.length >= 6}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (question.options.length > 2) {
                                const newOptions = question.options.slice(0, -1);
                                updateQuestion(index, 'options', newOptions);
                                // Ajustar respuesta correcta si es necesario
                                if (question.correctAnswer >= newOptions.length) {
                                  updateQuestion(index, 'correctAnswer', 0);
                                }
                              }
                            }}
                            disabled={question.options.length <= 2}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2 items-center">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[optionIndex] = e.target.value;
                              updateQuestion(index, 'options', newOptions);
                            }}
                            placeholder={`Opción ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center gap-2 min-w-fit">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                            />
                            <Label className="text-xs sm:text-sm whitespace-nowrap">Correcta</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Crear Capacitación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
