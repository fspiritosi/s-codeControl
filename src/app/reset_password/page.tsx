import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { RecoveryPasswordForm } from '@/components/RecoveryPasswordForm'

export default function PasswordRecovery() {
  return (
    <main className="flex items-center h-screen bg-black/5 justify-between flex-col md:flex-row bg-white">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] p-0 md:p-12 flex flex-col justify-center rounded-3xl">
        <h2 className="text-2xl pb-5 text-center text-pretty">¿Olvidaste tu contraseña? No te preocupes, te ayudaremos a restablecerla.</h2>
        <RecoveryPasswordForm />
      </section>
    </main>
  )
}
