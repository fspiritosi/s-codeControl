import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import GoogleButton from './componentsLogin/GoogleButton'
import { LoginButton } from './componentsLogin/LoginButton'
export default function Login() {
  return (
    <section className="flex items-center h-screen  justify-between flex-col md:flex-row ">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] p-0 md:p-12 lg:p-24 flex flex-col justify-center rounded-3xl">
        <Card>
          <CardHeader>
            <CardTitle>¡Es un placer verte de nuevo!</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-8 flex flex-col">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                  id="email"
                  name="email"
                  type="email"
                />
                <CardDescription id="email_error">
                  Por favor ingresa tu correo.
                </CardDescription>
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="mi contraseña segura"
                  autoComplete="current-password"
                />
                <CardDescription id="password_error">
                  Por favor ingresa tu contraseña.
                </CardDescription>
              </div>
              <div className="flex w-full justify-center flex-col items-center gap-5">
                <LoginButton />
                <Link href="/register" className="text-[0.8rem] ">
                  ¿No tienes una cuenta?{' '}
                  <span className="text-blue-400 ml-1">Créate una aquí</span>
                </Link>
              </div>
              <Separator
                orientation="horizontal"
                className="my-6 w-[70%] self-center"
              />
              <GoogleButton />
            </form>
          </CardContent>
        </Card>
      </section>
    </section>
  )
}
