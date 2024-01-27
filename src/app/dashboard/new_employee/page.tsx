import { EmployeeAccordion } from '@/components/EmployeeAccordion'

const NewEmployeePage = () => {
  return (
    <main className="text-3xl">
      <h2>Añadir nuevo empleado</h2>
      <section className='flex justify-center pt-8'>
        <EmployeeAccordion />
      </section>
    </main>
  )
}

export default NewEmployeePage
