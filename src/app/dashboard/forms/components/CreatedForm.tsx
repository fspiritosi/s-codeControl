'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Campo } from '@/types/types';
import { useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useLoggedUserStore } from '@/store/loggedUser';
import { types } from '@/types/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import cookie from 'js-cookie';
import jsPDF from 'jspdf';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DisplayCreatedForms from './DisplayCreatedForms';
import FormCard from './FormCard';
import { FormDisplay } from './FormDisplay';
import { FormPDF } from './Inputs';
const generateChartConfig = (data: any, category: string) => {
  const categoryConfig: any = {};
  data[category]?.forEach((item: any, index: number) => {
    const key = item.name ? item.name.replace(/_/g, ' ') : `item_${index}`;

    categoryConfig[key] = {
      label: item.name.replace(/_/g, ' ') || `Item ${index + 1}`,
      color: 'hsl(var(--chart-5))',
    };
  });

  return { [category]: categoryConfig };
};
const generateChartData = (categoryConfig: any, forms: any[]) => {
  // Obtener los últimos 6 meses en español
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString('es', { month: 'long' });
    months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
  }

  // Mapear cada mes a su correspondiente objeto de datos
  return months.map((month) => {
    // Filtrar formularios por mes
    const filteredForms = forms.filter((f) => {
      const formDate = new Date(f.created_at);
      const formMonthName =
        formDate.toLocaleString('es', { month: 'long' }).charAt(0).toUpperCase() +
        formDate.toLocaleString('es', { month: 'long' }).slice(1);
      return formMonthName === month;
    });

    // Sumar todas las respuestas de los formularios filtrados

    // Obtener el color correspondiente del mes

    return {
      month: month,
      respuestas: filteredForms.length,
    };
  });
};
function CreatedForm() {
  const [createdFormsState, setCreatedFormsState] = useState<any[] | undefined>(undefined);
  const supabase = supabaseBrowser();
  const [forms, setForms] = useState<any[] | null>([]);
  const [campos, setCampos] = useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
      title: 'Nombre del formulario',
      opciones: [],
    },
  ]);
  const [selectedForm, setSelectedForm] = useState<Campo[] | undefined>([]);
  const companyId = cookie.get('actualComp');
  const fetchForms = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from('custom_form').select('*').eq('company_id', companyId);
    if (error) {
      console.log(error);
    }
    if (data) {
      setCreatedFormsState(data);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams as any);
  const formId = params.get('form_id');

  const fetchAnswers = async () => {
    let { data: form_answers } = await supabase
      .from('form_answers')
      .select('*,form_id(*)')
      .eq('form_id', formId || '');

    setForms(form_answers);
  };

  useEffect(() => {
    if (formId) fetchAnswers();
  }, [formId]);

  const formKeys = Object.keys(JSON.parse(forms?.[0]?.answer || '{}'));

  const handleAnswersDelete = () => {
    params.delete('form_id');
    replace(`${pathname}?${params.toString()}`);
  };

  const createdFormCurrent = createdFormsState?.find((e) => e.id === formId);

  const chartConfig = generateChartConfig(forms, 'company');
  const chartData = generateChartData(chartConfig || {}, forms || []);

  const [pdfUrl, setPdfUrl] = useState('');
  const companyInfo = useLoggedUserStore((state) => state.actualCompany);
  // Función para formatear fechas
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      return date; // Retornar la fecha original si ocurre un error
    }
  };
  const renderFieldValue = (field: any, respuesta: any) => {
    let responseText = 'No respuesta';

    // Formatear la respuesta dependiendo del tipo de campo
    switch (field.tipo) {
      case 'Fecha':
        if (respuesta) {
          responseText = formatDate(respuesta); // Asegúrate de tener la función formatDate implementada
        }
        break;
      case 'Texto':
      case 'Área de texto':
      case 'Seleccion':
      case 'Seleccion multiple':
      case 'Radio':
      // case 'Subtitulo':
      // case 'Titulo':
      case 'Si-No':
      case 'Seleccion Predefinida':
        if (respuesta) {
          responseText = respuesta;
        }
        break;
      case 'Archivo':
        // Suponiendo que los archivos se manejan de manera especial, puedes ajustar aquí
        responseText = 'Archivo adjunto'; // O cualquier texto que represente un archivo
        break;
      case 'Seccion':
        // Si necesitas manejar secciones de manera especial, lo puedes ajustar aquí
        responseText = 'Sección'; // O cualquier texto que represente una sección
        break;
      default:
        responseText = '';
        break;
    }

    return responseText;
  };
  const [logoDimensions, setLogoDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (companyInfo?.company_logo) {
      const image = new Image();
      image.src = companyInfo.company_logo;

      image.onload = () => {
        // Obtener las dimensiones originales de la imagen
        setLogoDimensions({
          width: image.width,
          height: image.height,
        });
      };
    }
  }, [companyInfo]);

  const generarPDF = (formItem: any, printEmpty: boolean) => {
    const doc = new jsPDF(); // Crear una nueva instancia de jsPDF
    const pageHeight = doc.internal.pageSize.height; // Obtener la altura de la página
    const pageWidth = doc.internal.pageSize.width; // Obtener el ancho de la página
    const marginTop = 60; // Margen superior
    const marginBottom = 30; // Margen inferior
    const lineHeight = 10; // Altura de cada línea de texto
    const gridColumns = 4; // Número de columnas en el grid
    const spaceWidth = pageWidth - 50; // Espacio para las respuestas, todo el ancho menos márgenes
    const maxLogoHeight = 13; // Altura máxima deseada para el logo
    let yOffset = 48; // Offset inicial en el eje Y
    let pageCount = 1; // Contador de páginas
    let totalPages = 1; // Total de páginas
    const logoMargin = 20; // Margen desde el borde izquierdo
    // Función para agregar el encabezado
    function addHeader() {
      if (companyInfo?.company_logo) {
        const { width: imgWidth, height: imgHeight } = logoDimensions;

        // Calcular la relación de aspecto
        const aspectRatio = imgWidth / imgHeight;

        // Ajustar la altura y calcular el ancho para mantener la relación de aspecto
        let logoHeight = maxLogoHeight;
        let logoWidth = logoHeight * aspectRatio; //!revisar el tamaño del logo

        // Asegurarse de que el logo no exceda el ancho de la página
        const maxLogoWidth = doc.internal.pageSize.width - 2 * logoMargin; // Ancho máximo disponible para el logo
        if (logoWidth > maxLogoWidth) {
          logoWidth = maxLogoWidth;
          logoHeight = logoWidth / aspectRatio;
        }

        // Agregar el logo al PDF con el tamaño ajustado
        doc.addImage(companyInfo.company_logo, 'PNG', logoMargin, 10, logoWidth, logoHeight);
      }
      // Agregar la información de la empresa en el extremo derecho
      doc.setFontSize(10); // Tamaño de fuente para el encabezado
      doc.setTextColor(40, 40, 40); // Color del texto

      const pageWidth = doc.internal.pageSize.getWidth();
      const infoXPosition = pageWidth - 60; // Ajusta esta posición según sea necesario

      doc.text(companyInfo?.company_name || '', infoXPosition, 15);
      doc.text(companyInfo?.address?.trim() || '', infoXPosition, 20);
      doc.text(companyInfo?.city?.name?.trim() || '', infoXPosition, 25);
      doc.text(companyInfo?.province_id.name.trim() || '', infoXPosition, 30);
    }

    // Función para agregar el pie de página
    const addFooter = (pageNumber: number, totalPages: number) => {
      const footerText = `${companyInfo?.company_name || 'No disponible'} | ${companyInfo?.website || 'No disponible'}`;
      const contactText = `Tel: ${companyInfo?.contact_phone || 'No disponible'} | Email: ${companyInfo?.contact_email || 'No disponible'}`;

      doc.setFontSize(10); // Tamaño de fuente para el pie de página
      doc.setTextColor(40, 40, 40); // Color del texto

      doc.text(footerText, 20, pageHeight - marginBottom + 10);
      doc.text(contactText, 20, pageHeight - marginBottom + 15);

      const pageText = `${pageNumber} / ${totalPages}`;
      const pageTextWidth = doc.getStringUnitWidth(pageText) * doc.internal.scaleFactor;
      doc.text(pageText, pageWidth - pageTextWidth - 20, pageHeight - marginBottom + 10);
    };

    // Función para calcular el número total de páginas
    const calculateTotalPages = () => {
      let yOffset = marginTop;
      let pages = 1;

      formItem.form_id.form.forEach((section: any) => {
        if (section.id === '1') return;
        if (yOffset + lineHeight > pageHeight - marginBottom) {
          pages++;
          yOffset = marginTop;
        }
        yOffset += lineHeight * (section.sectionCampos?.length || 1) + 20;
      });

      return pages;
    };

    totalPages = calculateTotalPages();
    addHeader();

    // Función para aplicar estilos según el tipo de campo
    const applyFieldStyle = (field: any) => {
      switch (field.tipo) {
        case 'Titulo':
          doc.setFontSize(16); // Tamaño de fuente para el título
          doc.setFont('helvetica', 'bold'); // Fuente negrita
          doc.setTextColor(0, 0, 0); // Color del texto
          break;
        case 'Subtitulo':
          doc.setFontSize(14); // Tamaño de fuente para el subtítulo
          doc.setFont('helvetica', 'italic'); // Fuente cursiva
          doc.setTextColor(50, 50, 50); // Color del texto
          break;
        default:
          doc.setFontSize(12); // Tamaño de fuente predeterminado
          doc.setFont('helvetica', 'normal'); // Fuente normal
          doc.setTextColor(60, 60, 60); // Color del texto
          break;
      }
    };

    const drawOptionsGrid = (options: string[], startY: number) => {
      const optionWidth = (pageWidth - 50) / gridColumns; // Ancho de cada opción
      const optionHeight = 10; // Altura de cada opción
      const spaceBetween = 5; // Espacio entre opciones
      const shapeSize = 5; // Tamaño del cuadrado

      let xOffset = 30; // Offset inicial en el eje X
      let yOffset = startY;

      options.forEach((option: string, index: number) => {
        if (index % gridColumns === 0 && index !== 0) {
          xOffset = 30; // Reiniciar el offset X
          yOffset += optionHeight + spaceBetween; // Mover hacia abajo para la siguiente fila
        }

        // Dibuja el cuadrado
        if (printEmpty) {
          const shapeX = xOffset + 2; // Ajustar para que no se superponga con el texto
          const shapeY = yOffset - optionHeight / 3 + (optionHeight - shapeSize) / 2; // Ajustar verticalmente para centrar

          doc.setDrawColor(0, 0, 0); // Color del cuadrado
          doc.rect(shapeX, shapeY, shapeSize, shapeSize); // Dibuja un cuadrado vacío
        }

        // Agregar el texto de la opción
        doc.setFontSize(10);
        doc.text(option, xOffset + shapeSize * 2, yOffset + optionHeight / 2 - 2);

        xOffset += optionWidth; // Mover hacia la derecha para la siguiente opción
      });

      return yOffset + optionHeight + spaceBetween; // Retornar el nuevo offset Y después de mostrar todas las opciones
    };

    // Función para crear un espacio en blanco largo
    const drawLongBlankSpace = (x: number, y: number) => {
      doc.setFontSize(10);
      doc.setDrawColor(0, 0, 0); // Color de la línea
      doc.line(25, y, x + spaceWidth, y); // Línea para el espacio en blanco
    };

    formItem.form_id.form.forEach((section: any, sectionIndex: number) => {
      if (section.id === '1') return;
      if (yOffset + lineHeight > pageHeight - marginBottom) {
        addFooter(pageCount, totalPages);
        doc.addPage();
        addHeader();
        yOffset = marginTop;
        pageCount++;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(section.title, 20, yOffset);
      yOffset += 4;

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yOffset, pageWidth - 20, yOffset);
      yOffset += 8;

      section.sectionCampos?.forEach((field: any) => {
        if (yOffset + lineHeight > pageHeight - marginBottom) {
          addFooter(pageCount, totalPages);
          doc.addPage();
          addHeader();
          yOffset = marginTop;
          pageCount++;
        }

        applyFieldStyle(field); // Aplicar estilo al campo actual

        doc.text(field.title, 25, yOffset);
        yOffset += 8;

        const respuesta = JSON.parse(formItem.answer)[field.title.replace(/\s+/g, '_')];

        if (field.opciones && field.opciones.length > 0) {
          if (printEmpty) {
            // Si printEmpty es true, mostrar todas las opciones en un grid
            yOffset = drawOptionsGrid(field.opciones, yOffset);
          } else {
            // Si printEmpty es false, mostrar solo la opción seleccionada
            const selectedOption = respuesta || '';
            doc.setFontSize(10);
            doc.text(selectedOption, 30, yOffset);
            yOffset += 12;
          }
        } else {
          // Para campos sin opciones y si printEmpty es true
          if (printEmpty && field.tipo !== 'Titulo' && field.tipo !== 'Subtitulo') {
            drawLongBlankSpace(30, yOffset); // Dibuja el espacio en blanco largo
            yOffset += 12;
          } else {
            const responseText = renderFieldValue(field, respuesta);
            doc.setFontSize(10);
            doc.text(responseText, 30, yOffset);

            if (field.tipo !== 'Titulo' && field.tipo !== 'Subtitulo') yOffset += 12;
          }
        }
      });

      yOffset += 5;
    });

    addFooter(pageCount, totalPages);

    const pdfData = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfData);
    setPdfUrl(pdfUrl);
  };

  return (
    <div>
      {formId ? (
        <Card className="p-4 flex flex-col w-full">
          <div className="flex items-center justify-between mb-4">
            <Badge className="w-fit">
              <CardTitle className="text-xl ">
                {forms?.[0]?.form_id?.form.find((e: any) => e.id === '1').value ?? createdFormCurrent?.name}
              </CardTitle>
            </Badge>
            <div className="flex gap-4 justify-end">
              <Button variant={'outline'} className="self-end" onClick={() => handleAnswersDelete()}>
                Volver
              </Button>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button onClick={() => generarPDF(forms?.[0] || [], true)}>Imprimir vacio</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="grid grid-cols-1 place lg:grid-cols-[500px_1fr] gap-4">
                    <DrawerHeader className="flex flex-col">
                      <div>
                        <DrawerTitle className="text-2xl">Preview del PDF</DrawerTitle>
                        <DrawerDescription className="text-lg">Asi es como se vera el pdf</DrawerDescription>
                      </div>
                      <div className="space-x-4">
                        <DrawerClose>
                          <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                      </div>
                    </DrawerHeader>
                    <div>
                      <FormPDF pdfUrl={pdfUrl} />
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
          <>
            {' '}
            <div className="grid grid-cols-1 place lg:grid-cols-[300px_1fr] gap-4">
              <div className="min-w-[250px]">
                <FormCard
                  fetchAnswers={fetchAnswers}
                  chartConfig={chartConfig}
                  chartData={chartData}
                  key={0}
                  form={forms?.[0]?.form_id ?? createdFormCurrent}
                />
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableCaption>Lista de respuestas del formulario</TableCaption>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        {formKeys.map((key, index) => (
                          <TableCell className="text-[16px]" key={crypto.randomUUID()}>
                            <CardTitle>{key.replaceAll('_', ' ')}</CardTitle>
                          </TableCell>
                        ))}
                        <TableCell>
                          <CardTitle>Imprimir</CardTitle>
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="">
                      {forms?.map((formItem: any, formIndex) => (
                        <TableRow key={formIndex}>
                          {formKeys.map((key, index) => {
                            const value = JSON.parse(formItem.answer)[key];
                            const isDate =
                              typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
                            const formattedValue = isDate ? new Date(value).toLocaleDateString() : value;
                            return (
                              <TableCell key={crypto.randomUUID()}>
                                {Array.isArray(formattedValue) ? (
                                  <div className="gap-2 flex flex-col">
                                    {formattedValue.map((item, itemIndex) => (
                                      <Badge key={itemIndex}>{item}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  formattedValue
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <Drawer>
                              <DrawerTrigger asChild>
                                <Button onClick={() => generarPDF(formItem, false)}>Imprimir</Button>
                              </DrawerTrigger>
                              <DrawerContent>
                                <div className="grid grid-cols-1 place lg:grid-cols-[500px_1fr] gap-4">
                                  <DrawerHeader className="flex flex-col">
                                    <div>
                                      <DrawerTitle className="text-2xl">Preview del PDF</DrawerTitle>
                                      <DrawerDescription className="text-lg">
                                        Asi es como se vera el pdf
                                      </DrawerDescription>
                                    </div>
                                    <div className="space-x-4">
                                      <DrawerClose>
                                        <Button variant="outline">Cancel</Button>
                                      </DrawerClose>
                                    </div>
                                  </DrawerHeader>
                                  <div>
                                    <FormPDF pdfUrl={pdfUrl} />
                                  </div>
                                </div>
                              </DrawerContent>
                            </Drawer>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        </Card>
      ) : (
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup direction="horizontal" className="h-full max-h-[800px] items-stretch p-0 m-0">
            <ResizablePanel minSize={30}>
              <DisplayCreatedForms createdForms={createdFormsState} setSelectedForm={setSelectedForm} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel className="relative" minSize={30}>
              <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
              <FormDisplay
                campos={selectedForm ?? campos}
                selectedForm={selectedForm}
                setCampos={setCampos}
                fetchForms={fetchForms}
                created
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      )}
    </div>
  );
}

export default CreatedForm;
