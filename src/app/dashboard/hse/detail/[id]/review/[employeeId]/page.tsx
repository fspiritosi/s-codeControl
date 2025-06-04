import { TrainingEvaluation } from '@/components/Capacitaciones/training-evaluation';

const mockTraining = {
  id: '1',
  title: 'Seguridad en Carretera',
  evaluation: {
    questions: 5,
    passingScore: 4,
  },
};

const mockAnswers = [1, 1, 2, 1, 2]; // Respuestas del empleado

export default function ReviewPage({ params }: { params: { id: string; employeeId: string } }) {
  return (
    <div className="min-h-screen">
      <TrainingEvaluation
        training={mockTraining}
        mode="review"
        existingAnswers={mockAnswers}
        employeeName="Juan Pérez"
        attemptNumber={2}
      />
    </div>
  );
}
