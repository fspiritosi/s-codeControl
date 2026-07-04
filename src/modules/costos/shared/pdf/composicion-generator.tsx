import { renderToBuffer } from '@react-pdf/renderer';
import { ComposicionPDF, type ComposicionPDFData } from './composicion-template';

/** Renderiza la composición de costos a un Buffer PDF. */
export async function renderComposicionPDF(data: ComposicionPDFData): Promise<Buffer> {
  return renderToBuffer(<ComposicionPDF data={data} />);
}
