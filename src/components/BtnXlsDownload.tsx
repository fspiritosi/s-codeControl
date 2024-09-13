import { FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';

function BtnXlsDownload({ dataToDownload, fn, nameFile }: { dataToDownload: any; nameFile: string; fn: any }) {
  function createAndDownloadFile(data: any) {
    // Obtener todas las propiedades únicas
    const allKeys = Array.from(new Set(data.flatMap((item: any) => Object.keys(item))));

    // Crear un nuevo array de objetos con todas las propiedades
    const parseData = data.map((item: any) => {
      const newItem: any = {};
      allKeys.forEach((key: any) => {
        newItem[key] = item[key] !== undefined ? item[key] : '';
      });
      return newItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(parseData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dates');

    XLSX.writeFile(workbook, `${nameFile}.xlsx`, { compression: true });
  }

  return (
    <Button variant={'outline'} size={'icon'} onClick={() => createAndDownloadFile(fn(dataToDownload))}>
      <FileDown />
    </Button>
  );
}

export default BtnXlsDownload;
