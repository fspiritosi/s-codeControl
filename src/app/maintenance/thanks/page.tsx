'use client';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import Image from 'next/image';

export default function ThanksPage({}: {}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-2">
      <Card className="w-full max-w-md space-y-8 rounded-xl bg-white p-6 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
          </div>
          <CardDescription className="text-center text-gray-600">
            Sistema de Checklist y Mantenimiento de Equipos
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
