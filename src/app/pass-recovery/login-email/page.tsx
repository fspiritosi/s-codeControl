import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import LoginWithEmail from '@/components/LoginWithEmail'

export default function LoginEmail() {
  return (
    <main className="flex items-center h-screen bg-black/5 justify-between flex-col md:flex-row bg-white">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] p-0 md:p-12 flex flex-col justify-center rounded-3xl">
        <h2 className="text-2xl pb-5 text-center text-pretty">
          Ingresa tu correo electrónico para restablecer tu contraseña.
        </h2>
        <LoginWithEmail />
      </section>
    </main>
  )
}
