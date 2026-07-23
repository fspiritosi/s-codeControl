import { getSession } from '@/shared/lib/session';
import InitState from '@/shared/store/InitUser';
import {
  Activity,
  Boxes,
  Building2,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from 'lucide-react';
import SideBar from '@/shared/components/layout/Sidebar';

const sizeIcons = 24;

interface SideLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  position: number;
  /** Permiso requerido para mostrar el link. null = siempre visible. */
  requiredPermission: string | null;
  /** Módulo contratado (hired_modules) requerido para mostrar el link. null = siempre visible. */
  requiredModule?: string | null;
  /** Sección agrupadora (título de grupo). No matchea rutas por sí misma; su
   *  estado activo depende de los hijos. En colapsado navega a su href (1er hijo). */
  isSection?: boolean;
  /** Subitems anidados (menú colapsable). */
  children?: SideLink[];
}

// Estructura agrupada del sidebar (tsk-503). Cinco secciones principales +
// Dashboard suelto arriba y Configuración/Ayuda al pie. El `href` de cada
// sección apunta a su primer hijo para que el modo colapsado siga navegando.
const ALL_LINKS: SideLink[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={sizeIcons} />, position: 1, requiredPermission: null },
  {
    name: 'Recursos',
    href: '/dashboard/employee',
    icon: <Boxes size={sizeIcons} />,
    position: 2,
    requiredPermission: null,
    isSection: true,
    children: [
      { name: 'Empleados',     href: '/dashboard/employee',   icon: <Users size={sizeIcons} />,        position: 1, requiredPermission: 'empleados.view' },
      { name: 'Equipos',       href: '/dashboard/equipment',  icon: <Truck size={sizeIcons} />,        position: 2, requiredPermission: 'equipos.view' },
      { name: 'Documentos',    href: '/dashboard/document',   icon: <FileText size={sizeIcons} />,     position: 3, requiredPermission: 'documentacion.view' },
      { name: 'Calendario',    href: '/dashboard/calendario', icon: <CalendarDays size={sizeIcons} />, position: 4, requiredPermission: 'documentacion.view' },
    ],
  },
  {
    name: 'Operativo',
    href: '/dashboard/vtv',
    icon: <Activity size={sizeIcons} />,
    position: 3,
    requiredPermission: null,
    isSection: true,
    children: [
      { name: 'VTV',           href: '/dashboard/vtv',         icon: <CalendarCheck size={sizeIcons} />, position: 1, requiredPermission: 'equipos.view' },
      { name: 'Mantenimiento', href: '/dashboard/maintenance', icon: <Wrench size={sizeIcons} />,        position: 2, requiredPermission: 'mantenimiento.view' },
      { name: 'Operaciones',   href: '/dashboard/operations',  icon: <Calendar size={sizeIcons} />,      position: 3, requiredPermission: 'operaciones.view' },
      { name: 'Formularios',   href: '/dashboard/forms',       icon: <ClipboardList size={sizeIcons} />, position: 4, requiredPermission: 'formularios.view' },
    ],
  },
  {
    name: 'Administración',
    href: '/dashboard/company/actualCompany',
    icon: <Landmark size={sizeIcons} />,
    position: 4,
    requiredPermission: null,
    isSection: true,
    children: [
      { name: 'Empresa',           href: '/dashboard/company/actualCompany', icon: <Building2 size={sizeIcons} />,     position: 1, requiredPermission: 'empresa.view' },
      { name: 'Almacenes',         href: '/dashboard/warehouse',             icon: <Warehouse size={sizeIcons} />,     position: 2, requiredPermission: 'almacenes.view' },
      { name: 'Compras',           href: '/dashboard/purchasing',            icon: <ShoppingCart size={sizeIcons} />,  position: 3, requiredPermission: 'compras.view' },
      { name: 'Tesorería',         href: '/dashboard/treasury',              icon: <Wallet size={sizeIcons} />,        position: 4, requiredPermission: 'tesoreria.view' },
      { name: 'Gestión de Costos', href: '/dashboard/costos',                icon: <Calculator size={sizeIcons} />,    position: 5, requiredPermission: null, requiredModule: 'costos' },
    ],
  },
  {
    name: 'Comercial',
    href: '/dashboard/commercial',
    icon: <Store size={sizeIcons} />,
    position: 5,
    requiredPermission: null,
    isSection: true,
    children: [
      { name: 'Clientes',     href: '/dashboard/commercial/customers', icon: <Users size={sizeIcons} />,       position: 1, requiredPermission: 'empresa.view' },
      { name: 'Cotizaciones', href: '/dashboard/commercial/quotes',    icon: <FileText size={sizeIcons} />,    position: 2, requiredPermission: 'empresa.view' },
      { name: 'Ventas',       href: '/dashboard/sales',                icon: <ReceiptText size={sizeIcons} />, position: 3, requiredPermission: 'ventas.view' },
    ],
  },
  { name: 'HSE',           href: '/dashboard/hse',      icon: <GraduationCap size={sizeIcons} />, position: 6,  requiredPermission: null },
  { name: 'Configuración', href: '/dashboard/settings', icon: <Settings size={sizeIcons} />,      position: 90, requiredPermission: null },
  { name: 'Ayuda',         href: '/dashboard/help',     icon: <HelpCircle size={sizeIcons} />,    position: 91, requiredPermission: 'ayuda.view' },
];

function filterLinks(role: string | null, permissions: string[], hiredModules: string[]): SideLink[] {
  const hired = new Set(hiredModules);
  const isOwner = role === 'owner';
  const granted = new Set(permissions);

  // owner: no restricción por permisos, pero sí filtra por módulos contratados.
  const canShow = (link: SideLink): boolean =>
    (isOwner || link.requiredPermission === null || granted.has(link.requiredPermission)) &&
    (!link.requiredModule || hired.has(link.requiredModule));

  const filterChildren = (children?: SideLink[]): SideLink[] | undefined => {
    if (!children) return undefined;
    return children.filter(canShow).sort((a, b) => a.position - b.position);
  };

  return ALL_LINKS.filter(canShow)
    .map((link) => {
      if (!link.children) return link;
      const children = filterChildren(link.children) ?? [];
      // La sección hereda el href de su primer hijo visible (modo colapsado).
      return { ...link, href: children[0]?.href ?? link.href, children };
    })
    // Descarta secciones que quedaron sin hijos visibles.
    .filter((link) => !link.children || link.children.length > 0);
}

async function SideBarContainer() {
  const session = await getSession();

  const links = filterLinks(session.role, session.permissions, session.hiredModules).sort((a, b) => a.position - b.position);

  return (
    <>
      <InitState
        companies={session.companies}
        user={session.user}
        share_company_users={session.sharedCompanies}
        credentialUser={session.profile ? [session.profile] : []}
        role={session.role || ''}
        permissions={session.permissions}
      />
      <SideBar key={session.role} role={session.role || ''} Allinks={links} />
    </>
  );
}

export default SideBarContainer;
