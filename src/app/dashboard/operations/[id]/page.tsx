'use client';

import { TrainingEvaluation } from '@/components/Capacitaciones/training-evaluation';

const mockTraining = {
  id: '1',
  title: 'Seguridad en Carretera',
  evaluation: {
    questions: 5,
    passingScore: 4,
  },
};

export default function EvaluationPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen">
      <TrainingEvaluation training={mockTraining} mode="take" />
    </div>
  );
}
