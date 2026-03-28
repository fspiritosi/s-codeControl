import { getSession } from '@/shared/lib/session';
import InitState from '@/shared/store/InitUser';
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  UserSearch,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react';
import SideBar from '@/shared/components/layout/Sidebar';

const sizeIcons = 24;

const ALL_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={sizeIcons} />, position: 1 },
  { name: 'Empresa', href: '/dashboard/company/actualCompany', icon: <Building2 size={sizeIcons} />, position: 2 },
  { name: 'Empleados', href: '/dashboard/employee', icon: <Users size={sizeIcons} />, position: 3 },
  { name: 'Equipos', href: '/dashboard/equipment', icon: <Truck size={sizeIcons} />, position: 4 },
  { name: 'Documentación', href: '/dashboard/document', icon: <FileText size={sizeIcons} />, position: 5 },
  { name: 'Proveedores', href: '/dashboard/suppliers', icon: <UserSearch size={sizeIcons} />, position: 6 },
  { name: 'Almacenes', href: '/dashboard/warehouse', icon: <Warehouse size={sizeIcons} />, position: 7 },
  { name: 'Compras', href: '/dashboard/purchasing', icon: <ShoppingCart size={sizeIcons} />, position: 8 },
  { name: 'Mantenimiento', href: '/dashboard/maintenance', icon: <Wrench size={sizeIcons} />, position: 9 },
  { name: 'Formularios', href: '/dashboard/forms', icon: <ClipboardList size={sizeIcons} />, position: 10 },
  { name: 'Operaciones', href: '/dashboard/operations', icon: <Calendar size={sizeIcons} />, position: 11 },
  { name: 'HSE', href: '/dashboard/hse', icon: <GraduationCap size={sizeIcons} />, position: 12 },
  { name: 'Ayuda', href: '/dashboard/help', icon: <HelpCircle size={sizeIcons} />, position: 13 },
];

const GUEST_HIDDEN = new Set(['empresa', 'operaciones', 'mantenimiento', 'documentación']);

function filterLinksByRole(role: string | null, modules: string[]) {
  if (role === 'owner') return ALL_LINKS;

  if (role === 'Invitado') {
    return ALL_LINKS.filter((link) => !GUEST_HIDDEN.has(link.name.toLowerCase()));
  }

  if (modules.length === 0) return ALL_LINKS;

  const modulesLower = new Set(modules.map((m) => m.toLowerCase()));
  return ALL_LINKS.filter((link) => modulesLower.has(link.name.toLowerCase()));
}

async function SideBarContainer() {
  const session = await getSession();

  const links = filterLinksByRole(session.role, session.modules)
    .sort((a, b) => a.position - b.position);

  return (
    <>
      <InitState
        companies={session.companies}
        user={session.user}
        share_company_users={session.sharedCompanies}
        credentialUser={session.profile ? [session.profile] : []}
        role={session.role || ''}
      />
      <SideBar key={session.role} role={session.role || ''} Allinks={links} />
    </>
  );
}

export default SideBarContainer;
