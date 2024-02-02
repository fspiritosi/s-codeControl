import { EmployeeAccordion } from '@/components/EmployeeAccordion'

const NewEmployeePage = () => {
  return (
    <main className="">
      <header className='flex flex-col gap-4 mt-6'>
        <h2 className="text-4xl">Agregar Empleados</h2>
        <p>Aquí se muestra una tabla con los empleados registrados:</p>
      </header>
      <section className='flex justify-center pt-8'>
        <EmployeeAccordion />
      </section>
    </main>
  )
}

export default NewEmployeePage
