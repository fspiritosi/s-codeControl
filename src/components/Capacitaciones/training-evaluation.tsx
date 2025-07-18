'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Plus, Trash, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react'; // Asegúrate de importar useEffect

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface EvaluationProps {
  training: any;
  mode: 'take' | 'review' | 'preview' | 'edit';
  existingAnswers?: number[];
  employeeName?: string;
  attemptNumber?: number;
  onUpdate?: (questions: Question[], passingScore: number, timeLimit: number) => void;
}

export function TrainingEvaluation({
  training,
  mode,
  existingAnswers,
  employeeName,
  attemptNumber,
  onUpdate,
}: EvaluationProps) {
  // Estados para modo normal
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    existingAnswers || new Array(training.evaluation?.questions?.length || 0).fill(-1)
  );
  const [isSubmitted, setIsSubmitted] = useState(mode === 'review' || mode === 'preview');
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutos

  // Estados para modo edición
  const [editableQuestions, setEditableQuestions] = useState<Question[]>(training.evaluation?.questions || []);
  const [passingScore, setPassingScore] = useState<number>(training.evaluation?.passingScore || 0);
  const [timeLimit, setTimeLimit] = useState<number>(training.test_limit_time);

  // NUEVO: useEffect para sincronizar los estados editables con las props cuando está en modo edición
  useEffect(() => {
    if (mode === 'edit' && training?.evaluation) {
      setEditableQuestions(training.evaluation.questions || []);
      setPassingScore(training.evaluation.passingScore || 0);
      // setTimeLimit(training.test_limit_time);
    }
  }, [training?.evaluation, mode]); // Dependencias para re-ejecutar el efecto

  // Funciones para el modo de edición
  const handleAddQuestion = () => {
    if (mode !== 'edit') return;

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', ''],
      correctAnswer: 0,
    };

    const updatedQuestions = [...editableQuestions, newQuestion];
    setEditableQuestions(updatedQuestions);

    // Notificar al componente padre de los cambios
    if (onUpdate) {
      onUpdate(updatedQuestions, passingScore, timeLimit);
    }
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (mode !== 'edit') return;

    const updatedQuestions = editableQuestions.filter((q) => q.id !== questionId);
    setEditableQuestions(updatedQuestions);

    if (onUpdate) {
      onUpdate(updatedQuestions, passingScore, timeLimit);
    }
  };
  const handleUpdateTimeLimit = (timeLimit: number) => {
    if (mode !== 'edit') return;

    setTimeLimit(timeLimit);

    if (onUpdate) {
      onUpdate(editableQuestions, passingScore, timeLimit);
    }
  };

  const handleUpdateQuestion = (
    questionId: string,
    field: keyof Question | 'options',
    value: any,
    optionIndex?: number
  ) => {
    if (mode !== 'edit') return;

    const updatedQuestions = editableQuestions.map((q) => {
      if (q.id === questionId) {
        if (field === 'options' && optionIndex !== undefined) {
          // Actualizar una opción específica
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        } else {
          // Actualizar cualquier otro campo
          return { ...q, [field]: value };
        }
      }
      return q;
    });

    setEditableQuestions(updatedQuestions);

    if (onUpdate) {
      onUpdate(updatedQuestions, passingScore, timeLimit);
    }
  };

  const handleAddOption = (questionId: string) => {
    if (mode !== 'edit') return;

    const updatedQuestions = editableQuestions.map((q) => {
      if (q.id === questionId && q.options.length < 6) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    });

    setEditableQuestions(updatedQuestions);

    if (onUpdate) {
      onUpdate(updatedQuestions, passingScore, timeLimit);
    }
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    if (mode !== 'edit') return;

    const updatedQuestions = editableQuestions.map((q) => {
      if (q.id === questionId && q.options.length > 2) {
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);

        // Ajustar la respuesta correcta si es necesario
        let newCorrectAnswer = q.correctAnswer;
        if (optionIndex === q.correctAnswer) {
          newCorrectAnswer = 0; // Si se elimina la respuesta correcta, establecemos la primera opción como correcta
        } else if (optionIndex < q.correctAnswer) {
          newCorrectAnswer -= 1; // Si se elimina una opción antes de la respuesta correcta, ajustamos el índice
        }

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrectAnswer,
        };
      }
      return q;
    });

    setEditableQuestions(updatedQuestions);

    if (onUpdate) {
      onUpdate(updatedQuestions, passingScore, timeLimit);
    }
  };

  const handleUpdatePassingScore = (score: number) => {
    if (mode !== 'edit') return;

    const validScore = Math.min(Math.max(0, score), editableQuestions.length);
    setPassingScore(validScore);

    if (onUpdate) {
      onUpdate(editableQuestions, validScore, timeLimit);
    }
  };

  const questions = mode === 'edit' ? editableQuestions : training.evaluation?.questions || [];

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    if (mode === 'review' || mode === 'preview') return;

    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Aquí enviarías las respuestas al servidor
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index]?.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const score = calculateScore();
  const passed = score >= (training?.evaluation?.passingScore || 0);

  // Renderizado especial para el modo edit
  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        {/* Config section */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de evaluación</CardTitle>
            <CardDescription>Establece el puntaje mínimo para aprobar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="passing-score">Respuestas correctas para aprobar:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  disabled={(training?.attempts.length || 0) > 0 || false}
                  type="number"
                  id="passing-score"
                  min="0"
                  max={editableQuestions.length + 1}
                  value={passingScore}
                  onChange={(e) => handleUpdatePassingScore(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">de {editableQuestions.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Label htmlFor="passing-score">Tiempo límite de evaluación:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  disabled={(training?.attempts.length || 0) > 0 || false}
                  type="number"
                  id="passing-score"
                  value={timeLimit}
                  onChange={(e) => handleUpdateTimeLimit(Number.parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preguntas</h3>

          {training.attempts.length > 0 ? (
            <>
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-medium">No se puede modificar</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-muted-foreground">
                    No se puede modificar la evaluación porque ya ha sido respondida por al menos un empleado. Crear una
                    nueva capacitación si desea cambiar las preguntas o configuración.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : editableQuestions.length > 0 ? (
            <div className="space-y-4">
              {editableQuestions.map((question, qIndex) => (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="mr-2">
                          {qIndex + 1}
                        </Badge>
                        <Input
                          value={question.question}
                          onChange={(e) => handleUpdateQuestion(question.id, 'question', e.target.value)}
                          placeholder="Escribe la pregunta"
                          className="font-medium w-full"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveQuestion(question.id)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label>Opciones</Label>
                      <RadioGroup
                        value={question.correctAnswer.toString()}
                        onValueChange={(value) =>
                          handleUpdateQuestion(question.id, 'correctAnswer', Number.parseInt(value))
                        }
                      >
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={oIndex.toString()} id={`q${question.id}-option-${oIndex}`} />
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateQuestion(question.id, 'options', e.target.value, oIndex)}
                              placeholder={`Opción ${oIndex + 1}`}
                              className="flex-1"
                            />
                            {question.options.length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => handleRemoveOption(question.id, oIndex)}
                              >
                                <Trash className="h-3 w-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      {question.options.length < 6 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(question.id)}
                          className="w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Agregar Opción
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Botón "Agregar Pregunta" movido al final de la lista */}
              <Button onClick={handleAddQuestion} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Agregar Nueva Pregunta
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No hay preguntas aún.</p>
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar Primera Pregunta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {passed ? (
                <CheckCircle className="h-16 w-16 text-green-600" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {mode === 'review'
                ? 'Revisión de Evaluación'
                : mode === 'preview'
                  ? 'Vista Previa de Evaluación'
                  : 'Evaluación Completada'}
            </CardTitle>
            <CardDescription>
              {mode === 'review' && employeeName && (
                <div className="space-y-1">
                  <p>Empleado: {employeeName}</p>
                  <p>Intento: {attemptNumber}</p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">
                {score}/{questions.length}
              </div>
              {mode !== 'preview' && (
                <Badge variant={passed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                  {passed ? 'APROBADO' : 'DESAPROBADO'}
                </Badge>
              )}
              <p className="text-muted-foreground">
                Necesitas {training?.evaluation?.passingScore || 0} respuestas correctas para aprobar
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Revisión de Respuestas:</h3>
              {questions.map((question: Question, index: number) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <Card
                    key={question.id}
                    className={`border-l-4 ${mode === 'preview' ? 'border-l-gray-300' : isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          {mode !== 'preview' &&
                            (isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            ))}
                          <div className="flex-1">
                            <p className="font-medium">
                              {index + 1}. {question.question}
                            </p>
                          </div>
                        </div>

                        <div className={`ml-${mode === 'preview' ? '0' : '7'} space-y-2`}>
                          {question.options.map((option, optionIndex) => {
                            const isUserAnswer = userAnswer === optionIndex;
                            const isCorrectAnswer = optionIndex === question.correctAnswer;

                            return (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded text-sm ${
                                  mode === 'preview'
                                    ? optionIndex === question.correctAnswer
                                      ? 'bg-green-100 text-green-800 font-medium'
                                      : 'bg-gray-50'
                                    : isCorrectAnswer
                                      ? 'bg-green-100 text-green-800 font-medium'
                                      : isUserAnswer
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-50'
                                }`}
                              >
                                {option}
                                {isCorrectAnswer && ' ✓ (Correcta)'}
                                {mode !== 'preview' && isUserAnswer && !isCorrectAnswer && ' ✗ (Tu respuesta)'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">{training?.title || 'Evaluación de Capacitación'}</CardTitle>
              <CardDescription>
                Pregunta {currentQuestion + 1} de {questions.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">{formatTime(timeRemaining)}</span>
              </div>
              <Badge variant="outline">
                {answers.filter((a) => a !== -1).length}/{questions.length} respondidas
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion + 1}. {questions[currentQuestion].question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion]?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion, Number.parseInt(value))}
            disabled={mode === 'review' || mode === 'preview'}
            className="space-y-3"
          >
            {questions[currentQuestion].options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer p-3 rounded border hover:bg-gray-50 transition-colors"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2 flex-wrap justify-center">
          {questions.map((question: Question, index: number) => (
            <Button
              key={index}
              variant={currentQuestion === index ? 'default' : answers[index] !== -1 ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setCurrentQuestion(index)}
              className="w-10 h-10"
            >
              {index + 1}
            </Button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={answers.includes(-1) || mode === 'preview'}
            className="w-full sm:w-auto"
          >
            Finalizar Evaluación
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
            className="w-full sm:w-auto"
          >
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
