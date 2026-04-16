import { redirect } from 'next/navigation';

export default function SuppliersPage() {
  redirect('/dashboard/purchasing?tab=suppliers');
}
