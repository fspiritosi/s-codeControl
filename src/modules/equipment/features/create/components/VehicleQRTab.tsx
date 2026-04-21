'use client';

import { Button } from '@/shared/components/ui/button';
import { Copy, Download, Info, Printer } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { RefObject } from 'react';

interface VehicleQRTabProps {
  qrUrl: string;
  qrCodeRef: RefObject<HTMLDivElement | null>;
  downloadQR: () => Promise<void>;
  printQR: () => void;
  vehicle: any;
}

export function VehicleQRTab({ qrUrl, qrCodeRef, downloadQR, printQR, vehicle }: VehicleQRTabProps) {
  return (
    <div className="flex w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center space-y-4">
          <>
            <div ref={qrCodeRef}>
              <QRCode id="vehicle-qr-code" value={qrUrl} size={300} level="H" />
            </div>
            <div className="flex space-x-2">
              <Button onClick={downloadQR} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
              <Button onClick={printQR} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(qrUrl);
                  toast.success('URL copiada al portapapeles');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar url
              </Button>
            </div>
          </>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informacion del QR</h3>
          <p className="text-sm text-gray-600">
            Este codigo QR contiene un enlace unico a la informacion de este equipo. Al escanearlo, se puede
            acceder rapidamente a:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Especificaciones tecnicas del equipo</li>
            <li>Historial de mantenimiento y reparaciones</li>
            <li>Registrar mantenimientos y reparaciones futuras</li>
            <li>Documentacion y certificados</li>
          </ul>
          <div className="bg-green-50 p-4 rounded-md flex items-start space-x-3">
            <Info className="w-5 h-5 text-green-500 mt-0.5" />
            <p className="text-sm text-green-700">
              Asegurate de escanear este codigo QR con la camara de tu dispositivo o con una aplicacion de lectura
              de QR como Google Lens o QR Code Reader.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
