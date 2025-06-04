'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface EvaluationProps {
  training: any;
  mode: 'take' | 'review' | 'preview';
  existingAnswers?: number[];
  employeeName?: string;
  attemptNumber?: number;
}

export function TrainingEvaluation({ training, mode, existingAnswers, employeeName, attemptNumber }: EvaluationProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    existingAnswers || new Array(training.evaluation.questions.length).fill(-1)
  );
  const [isSubmitted, setIsSubmitted] = useState(mode === 'review' || mode === 'preview');
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutos

  const questions = training.evaluation.questions;

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
      if (answer === questions[index].correctAnswer) {
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
