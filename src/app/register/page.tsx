import RenderBanner from '@/components/RenderBanner';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import Link from 'next/link';
import { RegisterButton } from './componentsRegister/RegisterButton';
// import { RegisterForm } from '@/components/RegisterForm'

export default function Register() {
  return (
    <section className="min-h-screen  mb-4 lg:mb-0 bg-white dark:bg-transparent">
      <div className="container relative flex-col grid-cols-1 justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0  md:px-4 min-h-screen">
        <RenderBanner />

        <div className="lg:p-8 relative z-50   md:p-8 pt-7 p-0 flex flex-col justify-center items-center w-full">
          <Link className="relative z-20 lg:hidden items-center font-bold lg:text-2xl flex text-3xl " href="/">
            <Image
              src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png"
              alt="Logo de codecontrol"
              className="size-12 mr-4"
              width={120}
              height={120}
            />
            CodeControl
          </Link>
          <div className="w-full  overflow-y-auto max-h-screen">
            <CardTitle className="text-2xl font-semibold tracking-tight mb-4 text-balance lg:text-left text-center">
              ¡Estás a un paso de unirte a nosotros!
            </CardTitle>
            <form className="space-y-3 flex flex-col">
              <div className="space-y-2">
                <Label className="ml-2 text-lg" htmlFor="firstname">
                  Nombre
                </Label>
                <Input
                  id="firstname"
                  name="firstname"
                  placeholder="Escribe tu nombre aquí"
                  className="text-md"
                  type="text"
                  required
                />
                <CardDescription id="firstname_error" className="max-w-full" />
              </div>
              <div className="space-y-2">
                <Label className="ml-2 text-lg" htmlFor="lastname">
                  Apellido
                </Label>
                <Input
                  id="lastname"
                  placeholder="Tu apellido"
                  name="lastname"
                  type="text"
                  className="text-md"
                  required
                />
                <CardDescription id="lastname_error" className="max-w-full text-lg" />
              </div>
              <div className="space-y-2">
                <Label className="ml-2 text-lg" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  className="text-md"
                  placeholder="ejemplo@correo.com"
                  type="email"
                  required
                />
                <CardDescription id="email_error" className="max-w-full text-lg" />
              </div>
              <div className="space-y-2">
                <Label className="ml-2 text-lg" htmlFor="password">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  placeholder="Elige una contraseña segura"
                  name="password"
                  className="text-md"
                  type="password"
                  required
                />
                <CardDescription id="password_error" className="max-w-full text-lg" />
              </div>
              <div className="space-y-2">
                <Label className="ml-2 text-lg" htmlFor="confirmPassword">
                  Confirmar Contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  placeholder="Repite tu contraseña"
                  name="confirmPassword"
                  type="password"
                  className="text-md"
                  required
                />
                <CardDescription id="confirmPassword_error" className="max-w-full text-lg" />
              </div>
              <div className="flex w-full justify-center flex-col items-center gap-5">
                <RegisterButton />
                <p className="text-md">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className=" text-blue-400 ml-1">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
