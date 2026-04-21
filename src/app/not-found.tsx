import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        Pagina no encontrada
      </h2>
      <p className="max-w-md text-gray-600">
        La pagina que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
