import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { RegisterForm } from '@/components/RegisterForm'

export default function Register() {
  return (
    <section className="flex items-center bg-black/5 justify-between flex-col lg:flex-row bg-white">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] lg:p-24 p-0 flex flex-col justify-center rounded-3xl min-h-screen md:p-0">
        <h2 className="self-center text-2xl pb-5 text-pretty text-center">
          ¡Estás a un paso de unirte a nosotros!
        </h2>
        <RegisterForm />
      </section>
    </section>
  )
}
