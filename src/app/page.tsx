import Landing from '@/modules/landing/features/home/components/Landing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CodeControl — Software para trabajar mejor',
  description:
    'Software a medida y soluciones de gestión para conectar personas, información y operaciones. Conocé CodeControl y coordiná una llamada.',
};

export default function Home() {
  return <Landing />;
}
