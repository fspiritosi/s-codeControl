import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { UpdateUserPasswordForm } from '@/components/UpdateUserPasswordForm'

export default function UpdateUserPassword() {
  return (
    <section className="flex items-center h-screen bg-black/5 justify-between flex-col md:flex-row bg-white">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] p-0 md:p-12 flex flex-col justify-center rounded-3xl">
        <h2 className="text-2xl pb-5 text-center text-pretty">
          Establece tu nueva contraseña
        </h2>
        <p className="text-pretty mb-9 text-black/70 text-center">
          Tu cuenta está a un paso de ser recuperada. Por favor, crea una nueva
          contraseña que sea segura y fácil de recordar para ti. Asegúrate de
          que tu contraseña tenga al menos 6 caracteres, incluya una combinación
          de letras mayúsculas, minúsculas, números o símbolos.
        </p>
        <UpdateUserPasswordForm />
      </section>
    </section>
  )
}
