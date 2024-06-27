import { Separator } from '@/components/ui/separator';

export type data = {
  name: string;
  info: string;
};

export const ItemCompany = (itemData: data) => {
  return (
    <div>
      <p>
        <span className="text-gray-600 font-bold">{itemData.name}: </span> {itemData.info}
      </p>
      <Separator />
    </div>
  );
};
