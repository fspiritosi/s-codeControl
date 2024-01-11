//import { RegisterForm } from '@/components/RegisterForm'
import { CompanyRegister } from '@/components/ui/CompaniRegister'
export default function companyRegister() {
  return (
    <main className="flex justify-center items-center py-10 flex-col bg-black/5">
      <div className="bg-white sm:w-1/2 p-10 rounded-xl flex flex-col">
        <h2 className="self-center text-2xl pb-5">Registrar Compañía</h2>
        <CompanyRegister />
      </div>
    </main>
  )
}
