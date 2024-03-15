import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { LoginForm } from '@/components/LoginForm'

export default function Login() {
  return (
    <main className="flex items-center h-screen bg-black/5 justify-between flex-col md:flex-row bg-white dark:bg-neutral-950">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] p-0 md:p-12 lg:p-24 flex flex-col justify-center rounded-3xl">
        <h2 className="text-2xl pb-5">¡Es un placer verte de nuevo!</h2>
        <LoginForm />
      </section>
    </main>
  )
}
