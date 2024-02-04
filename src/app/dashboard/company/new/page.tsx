import { CompanyRegister } from '@/components/CompanyRegister'
export default function companyRegister() {
  return (
    <main className="">
      <h2 className=" text-3xl pb-5 pl-10">Registrar Compañía</h2>
      <p className="pl-10 max-w-1/2">
        Completa este formulario con los datos de tu nueva compañia
      </p>
      <div className="bg-white  p-10 rounded-xl flex w-full">
        <CompanyRegister />
      </div>
    </main>
  )
}
