
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"



export default function CreateUser() {
    return (
        <>
            <Card
            className="sm:col-span-2" x-chunk="dashboard-05-chunk-0"
            >
            <CardHeader className="pb-3">
                <CardTitle>Usuarios</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                Crear nuevos usuarios que sean administradores de la plataforma de CodeControl
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button>Create New Order</Button>
            </CardFooter>
            </Card>
      </>
    )
}