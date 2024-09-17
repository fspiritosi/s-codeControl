import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function AnswerCard({ data }: { data: any }) {
  function formatDate(dateString: any) {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  }

  return (
    <Card className="p-4 mb-4 w-fit">
      {Object.keys(data).map((key, index) => {
        let value = data[key];

        // Formato especial para fechas y arrays
        if (typeof value === 'string' && new Date(value).toString() !== 'Invalid Date') {
          value = formatDate(value);
        } else if (Array.isArray(value)) {
          value = value.join(', ');
        }

        return (
          <div key={crypto.randomUUID()} className="mb-2">
            <strong>{key.replace(/_/g, ' ')}:</strong> {value}
          </div>
        );
      })}
      <Button>Generar pdf</Button>
    </Card>
  );
}

export default AnswerCard;
