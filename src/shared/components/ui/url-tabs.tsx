'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

// ============================================
// TYPES
// ============================================

interface UrlTabsProps extends Omit<React.ComponentProps<typeof TabsPrimitive.Root>, 'onValueChange'> {
  /**
   * Nombre del parámetro de URL para el tab
   * @default "tab"
   * @example "tab" -> ?tab=employees
   */
  paramName?: string;

  /**
   * Parámetros de URL a preservar cuando cambia el tab
   * @default []
   * @example ["search", "filter"] -> preserva ?search=x&filter=y
   */
  preserveParams?: string[];

  /**
   * Parámetros de URL a eliminar cuando cambia el tab
   * Útil para resetear paginación, subtabs, etc.
   * @default ["page"]
   * @example ["page", "subtab"] -> elimina ?page=2&subtab=monthly
   */
  resetParams?: string[];

  /**
   * Base URL para la navegación. Si no se especifica, usa la URL actual.
   * @example "/dashboard/documents"
   */
  baseUrl?: string;

  /**
   * Callback adicional cuando cambia el tab (después de la navegación)
   */
  onTabChange?: (value: string) => void;

  /**
   * Si es true, usa router.replace en vez de router.push
   * Útil para no agregar entradas al historial
   * @default false
   */
  replace?: boolean;

  /**
   * Desactiva la navegación por URL (funciona como Tabs normal)
   * @default false
   */
  disableUrlNavigation?: boolean;
}

// ============================================
// URL TABS COMPONENT
// ============================================

/**
 * UrlTabs - Componente de tabs con navegación por URL integrada
 *
 * Encapsula la lógica de useRouter/useSearchParams para que los
 * componentes padres puedan ser Server Components.
 *
 * @example
 * ```tsx
 * // En un Server Component
 * export async function MyPage({ searchParams }) {
 *   const currentTab = searchParams.tab || 'first';
 *
 *   return (
 *     <UrlTabs value={currentTab} paramName="tab">
 *       <UrlTabsList>
 *         <UrlTabsTrigger value="first">First</UrlTabsTrigger>
 *         <UrlTabsTrigger value="second">Second</UrlTabsTrigger>
 *       </UrlTabsList>
 *
 *       <UrlTabsContent value="first">
 *         <Suspense fallback={<Skeleton />}>
 *           <FirstTabServerComponent />
 *         </Suspense>
 *       </UrlTabsContent>
 *     </UrlTabs>
 *   );
 * }
 * ```
 */
function UrlTabs({
  paramName = 'tab',
  preserveParams = [],
  resetParams = ['page'],
  baseUrl,
  onTabChange,
  replace = false,
  disableUrlNavigation = false,
  className,
  children,
  ...props
}: UrlTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValueChange = React.useCallback(
    (value: string) => {
      if (disableUrlNavigation) {
        onTabChange?.(value);
        return;
      }

      // Construir nuevos params
      const newParams = new URLSearchParams();

      // Preservar params específicos de la URL actual
      preserveParams.forEach((param) => {
        const val = searchParams.get(param);
        if (val) newParams.set(param, val);
      });

      // Copiar todos los params actuales excepto los que se resetean
      searchParams.forEach((val, key) => {
        if (key !== paramName && !resetParams.includes(key) && !preserveParams.includes(key)) {
          newParams.set(key, val);
        }
      });

      // Setear el nuevo valor del tab
      newParams.set(paramName, value);

      // Construir URL
      const queryString = newParams.toString();
      const url = baseUrl ? `${baseUrl}${queryString ? `?${queryString}` : ''}` : `?${queryString}`;

      // Navegar
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }

      // Callback adicional
      onTabChange?.(value);
    },
    [paramName, preserveParams, resetParams, baseUrl, replace, disableUrlNavigation, router, searchParams, onTabChange]
  );

  return (
    <TabsPrimitive.Root
      data-slot="url-tabs"
      className={cn('flex flex-col gap-2', className)}
      onValueChange={handleValueChange}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

// ============================================
// SUB-COMPONENTS (re-export con alias)
// ============================================

function UrlTabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="url-tabs-list"
      className={cn(
        'bg-primary/10 text-muted-foreground inline-flex h-10 w-full items-center rounded-lg p-1 gap-1',
        className
      )}
      {...props}
    />
  );
}

function UrlTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="url-tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
        'text-muted-foreground hover:text-foreground',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function UrlTabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="url-tabs-content" className={cn('flex-1 outline-none', className)} {...props} />
  );
}

// ============================================
// EXPORTS
// ============================================

export { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger };
export type { UrlTabsProps };
