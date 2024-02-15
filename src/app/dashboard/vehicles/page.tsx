import { VehiclesForm } from '@/components/VehiclesForm'

const NewEmployeePage = () => {
  return (
    <main className="">
      <header className="flex flex-col gap-4 mt-6">
        <h2 className="text-4xl">Agregar equipos</h2>
        <p>Aquí se muestra una tabla todos los equipos</p>
      </header>
      <section className="flex pt-8">
        <VehiclesForm />
      </section>
    </main>
  )
}

export default NewEmployeePage
