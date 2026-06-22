/**
 * Query keys del feature Ayuda compartidas entre server (prefetch) y cliente (useQuery).
 *
 * Este archivo NO lleva 'use client' a propósito: las constantes deben ser
 * importables tanto desde Server Components (en layouts que hacen prefetch)
 * como desde Client Components (hooks que las usan en useQuery / invalidación).
 *
 * Las constantes exportadas desde archivos 'use client' NO son accesibles
 * desde Server Components — RSC bundler las trata como referencias cliente.
 */

export const MY_TICKETS_WITH_UNREAD_QUERY_KEY = ['ayuda', 'my-tickets-with-unread'] as const;
