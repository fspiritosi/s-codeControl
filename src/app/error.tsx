'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error global:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        Algo salio mal
      </h2>
      <p className="max-w-md text-gray-600">
        Ocurrio un error inesperado. Por favor, intenta nuevamente.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
