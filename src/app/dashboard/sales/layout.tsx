import { SalesNav } from '@/modules/sales/shared/components/SalesNav';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <SalesNav />
      {children}
    </div>
  );
}
