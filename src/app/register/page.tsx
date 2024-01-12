import { RegisterForm } from '@/components/RegisterForm'

export default function Register() {
  return (
    <main className="flex justify-center items-center py-10 flex-col bg-black/5">
      <div className="bg-white sm:w-1/2 p-10 rounded-xl flex flex-col">
        <h2 className="self-center text-2xl pb-5">Registrarse</h2>
        <RegisterForm />
      </div>
    </main>
  )
}
