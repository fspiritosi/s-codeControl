import CardsGrid from '@/modules/dashboard/features/overview/components/CardsGrid';

export default async function DashboardComponent() {
  return (
    <div className="px-6">
      <section className="mb-4">
        <CardsGrid />
      </section>
    </div>
  );
}
