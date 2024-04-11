import { CompanyLogoBackground } from '@/components/CompanyLogoBackground'
import { LoginForm } from '@/components/LoginForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
  return (
    <section className="flex items-center h-screen bg-black/5 justify-between flex-col md:flex-row bg-white dark:bg-neutral-950">
      <CompanyLogoBackground />
      <section className=" md:w-1/2 w-[80%] p-0 md:p-12 lg:p-24 flex flex-col justify-center rounded-3xl">
        <Card>
          <CardHeader>
            <CardTitle>¡Es un placer verte de nuevo!</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </section>
  )
}
