import { Card } from '@/components/ui/card'
import { Mail } from './components/mail'

export default function MailPage() {
  return (
    <div className="hidden flex-col md:flex mt-6 md:mx-7 overflow-hidden max-h-full">
      <Card className="p-0">
        <Mail navCollapsedSize={4} />
      </Card>
    </div>
  )
}
