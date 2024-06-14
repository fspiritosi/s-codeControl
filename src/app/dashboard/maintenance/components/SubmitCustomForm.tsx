'use client'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormField } from '@/types/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import FieldRenderer from '../formUtils/fieldRenderer'
import { buildFormData, buildFormSchema } from '../formUtils/formUtils'

interface Props {
  campos: any[] | null
}

export function SubmitCustomForm({ campos }: Props) {
  const formObject = buildFormData(campos, false)
  const FormSchema = buildFormSchema(formObject)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function handleCustomFormSubmit(data: z.infer<typeof FormSchema>) {
    console.log('data', data)
  }

  console.log(campos)

  return (
    <div className=" px-8 py-5  rounded-e-xl rounded">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCustomFormSubmit)}>
          <div className="w-full space-y-6 grid grid-cols-3 gap-x-10">
            {formObject?.map((campo: FormField, index: number) => (
              <FieldRenderer
                key={index}
                campo={campo}
                form={form}
                index={index}
                completObjet={formObject}
              />
            ))}
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  )
}
