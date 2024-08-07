import { FormField } from '@/types/types';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  DateField,
  FileField,
  FormNameField,
  MultiSelectField,
  PredefinedSelectField,
  RadioField,
  RadioGroupField,
  SeccionDate,
  SeccionObservaciones,
  SectionField,
  SelectField,
  SeparatorField,
  SubtitleField,
  TextAreaField,
  TextField,
  TitleField,
} from '../components/Inputs';

interface FieldRendererProps {
  campo: FormField;
  form: UseFormReturn<any> | null;
  index: number;
  completObjet: FormField[] | null;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ campo, form, index, completObjet }) => {
  switch (campo.tipo) {
    case 'Seccion':
      return <SectionField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Si-No':
      return <RadioField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Texto':
      return <TextField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Área de texto':
      return <TextAreaField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Archivo':
      return <FileField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Radio':
      return <RadioGroupField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Seleccion multiple':
      return <MultiSelectField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Fecha':
      return <DateField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Seleccion':
      return <SelectField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Seleccion Predefinida':
      return <PredefinedSelectField completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'SectionDate':
      return <SeccionDate completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'SectionObservaciones':
      return <SeccionObservaciones completObjet={completObjet} campo={campo} form={form} index={index} />;
    case 'Nombre del formulario':
      return <FormNameField campo={campo} index={index} />;
    case 'Titulo':
      return <TitleField campo={campo} index={index} />;
    case 'Subtitulo':
      return <SubtitleField campo={campo} index={index} />;
    case 'Separador':
      return <SeparatorField campo={campo} index={index} />;
    default:
      return null;
  }
};

export default FieldRenderer;
