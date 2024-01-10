import { LoginForm } from '@/components/LoginForm'

export default function Login() {
  return (
    <main className="flex justify-center items-center h-screen flex-col bg-black/5">
      <div className="bg-white sm:w-1/2 p-10 rounded-xl flex flex-col">
        <h2 className="self-center text-2xl pb-5">Login</h2>
        <LoginForm />
      </div>
    </main>
  )
}
