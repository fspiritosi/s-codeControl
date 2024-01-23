import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { RegisterForm } from '@/components/RegisterForm'

export default function Register() {
  return (
    <main className="flex items-center bg-black/5 justify-between flex-col lg:flex-row bg-white">
      
    <section className="h-screen md:max-h-[200px] min-h-[300px] flex justify-center max-h-[200px] items-center md:w-1/2 bg-black/10 w-screen ">
      <div className="relative h-full w-screen md:w-full bg-white lg:max-h-[500px]">
        <div className="absolute h-full w-screen md:w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>
      <img
        src="/logoNegro.webp"
        alt="imagen del logo"
        className="h-[300px] md:h-[500px]  absolute"
      />
    </section>
     
      <section className=" md:w-1/2 w-[80%] lg:p-24 p-0 flex flex-col justify-center rounded-3xl min-h-screen md:p-0">
        <h2 className="self-center text-2xl pb-5 text-pretty text-center">¡Estás a un paso de unirte a nosotros!</h2>
        <RegisterForm />
      </section>
    </main>
  )
}
