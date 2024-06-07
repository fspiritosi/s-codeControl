'use client'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Campo } from '@/types/types'
import { ReaderIcon } from '@radix-ui/react-icons'
import { Dispatch, SetStateAction } from 'react'

export default function DisplayCreatedForms({
  createdForms,
  setSelectedForm
}: {
  createdForms: any[] | null
  setSelectedForm: Dispatch<SetStateAction<Campo[] | undefined>>
}) {
  const handleSelectForm = (index: number) => {
    setSelectedForm(createdForms?.[index].form as Campo[])
  }

  return (
    <section className="p-4 pt-0 max-h-[68vh]">
      <CardTitle className="mb-2 text-xl">Forms creados</CardTitle>

      <div className="space-y-3">
        {createdForms?.map((form, index) => {
          return (
            <Card className="p-2 flex items-center justify-between" key={index}>
              <CardTitle className="capitalize flex items-center">
                <ReaderIcon className="size-6 mr-2" />
                {form.name}
              </CardTitle>
              <Button onClick={() => handleSelectForm(index)}>
                Vista previa
              </Button>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
