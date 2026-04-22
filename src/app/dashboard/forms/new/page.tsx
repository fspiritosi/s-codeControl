import { Card } from '@/shared/components/ui/card';
import { FormCustomContainer } from '@/modules/forms/features/custom-forms/components/FormCustomContainer';

export default function MailPage() {
  return (
    <div className="hidden flex-col md:flex mt-6 md:mx-7 overflow-hidden max-h-full">
      <Card className="p-0">
        <FormCustomContainer employees={true} company={true}  documents={true} equipment={true} />
      </Card>
    </div>
  );
}
