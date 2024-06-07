import { Card, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DisplayCreatedForms({
  createdForms,
}: {
  createdForms: any[] | null
}) {
  console.log(createdForms)

  return (
    <ScrollArea className="flex flex-col gap-2 p-4 pt-0 space-y-2  max-h-[68vh]">
      <CardTitle>Forms creados</CardTitle>
      {createdForms?.map((form, index) => {
        return (
          <Card className='p-2' key={index}>
            <p>{form.name}</p>
          </Card>
        )
      })}
    </ScrollArea>
  )
}
