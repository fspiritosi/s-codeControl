import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { RegisterButton } from './componentsRegister/RegisterButton'
// import { RegisterForm } from '@/components/RegisterForm'

export default function Register() {
  return (
    <section className="flex items-center bg-black/5 justify-between flex-col lg:flex-row bg-white">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] lg:p-24 p-0 flex flex-col justify-center rounded-3xl min-h-screen md:p-0">
        <h2 className="self-center text-2xl pb-5 text-pretty text-center">
          ¡Estás a un paso de unirte a nosotros!
        </h2>
        {/* <RegisterForm /> */}
        <form className="space-y-6 flex flex-col">
          <div>
            <Label className="ml-2" htmlFor="firstname">
              Nombre
            </Label>
            <Input
              id="firstname"
              name="firstname"
              placeholder="Escribe tu nombre aquí"
              type="text"
              required
            />
            <CardDescription id="firstname_error" className="max-w-full" />
          </div>
          <div>
            <Label className="ml-2" htmlFor="lastname">
              Apellido
            </Label>
            <Input
              id="lastname"
              placeholder="Tu apellido"
              name="lastname"
              type="text"
              required
            />
            <CardDescription id="lastname_error" className="max-w-full" />
          </div>
          <div>
            <Label className="ml-2" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              placeholder="ejemplo@correo.com"
              type="email"
              required
            />
            <CardDescription id="email_error" className="max-w-full" />
          </div>
          <div>
            <Label className="ml-2" htmlFor="password">
              Contraseña
            </Label>
            <Input
              id="password"
              placeholder="Elige una contraseña segura"
              name="password"
              type="password"
              required
            />
            <CardDescription id="password_error" className="max-w-full" />
          </div>
          <div>
            <Label className="ml-2" htmlFor="confirmPassword">
              Confirmar Contraseña
            </Label>
            <Input
              id="confirmPassword"
              placeholder="Repite tu contraseña"
              name="confirmPassword"
              type="password"
              required
            />
            <CardDescription
              id="confirmPassword_error"
              className="max-w-full"
            />
          </div>
          <div className="flex w-full justify-center flex-col items-center gap-5">
            <RegisterButton />
            <p className="text-[0.9rem]">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className=" text-blue-400 ml-1">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </section>
    </section>
  )
}
