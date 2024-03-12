import DocumentNav from '@/components/DocumentNav'

export default function page() {

  return (
    <section>
      <div className="flex justify-between flex-wrap">
        <h2>Aqui estaran todos los documentos de la empresa</h2>
        <div className="flex gap-3 flex-wrap">
          <DocumentNav />
        </div>
      </div>
    </section>
  )
}
