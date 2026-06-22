'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 minuto — datos frescos no se refetchean
        gcTime: 5 * 60 * 1000, // 5 minutos — mantener cache al cambiar de tab/página
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export default function TanstackQueryProvider({ children }: { children: React.ReactNode }) {
  // useState con factory — cada request SSR monta su propio QueryClient (evita leaks entre usuarios)
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
