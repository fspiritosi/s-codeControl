"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "../ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  message: z.string().min(2).max(500),
})


function Contact() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      message: "",
    },
  })
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }


  return (
    <div className="relative p-4 md:py-5">
      <div className="grid max-w-5xl mx-auto ">
      <Card>
        <CardHeader>
          <CardTitle>Contactenos</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre y Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre y Apellido" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ingresa tu nombre y apellido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nombre@exemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ingresa tu email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ingresa tu mensaje..." {...field} />
                    </FormControl>
                  
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size='lg' className="w-full">Enviar</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    
      </div>
    </div>
  )
}

export default Contact