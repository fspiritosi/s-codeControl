import { Info } from 'lucide-react';

function InfoComponent({ message, size }: { message: string; size: string }) {
  const sizeComponent: any = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    
  };
  return (
    <div className={`bg-blue-50 rounded-md flex items-start space-x-3 ${sizeComponent[size]}`}>
      <Info className="w-5 h-5 text-blue-500 mt-0.5" />
      <p className="text-sm text-blue-700">{message}</p>
    </div>
  );
}

export default InfoComponent;
