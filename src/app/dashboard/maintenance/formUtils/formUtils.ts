import { FormField } from '@/types/types'
import { z } from 'zod'

export const buildFormData = (campos: any[] | null): FormField[] => {
  const formArray: FormField[] = []
  formArray.push({
    formName: 'Nombre del formulario',
    title: 'Nombre del formulario',
    value: campos?.[0]?.name,
    tipo: 'Nombre del formulario',
    id: '',
    placeholder: '',
  })

  if (campos && campos.length > 0 && campos[0]?.form) {
    campos[0].form.forEach((campo: any) => {
      if (campo.tipo === 'Seccion') {
        formArray.push({
          formName: `inicio_seccion_${campo.title.replace(/ /g, '_')}`,
          title: '',
          value: campo.title,
          tipo: 'Titulo',
          id: '',
          placeholder: '',
        })
        campo.sectionCampos.forEach((sectionCampo: any) => {
          formArray.push({
            formName: `${sectionCampo.title.replace(/ /g, '_')}`,
            title: `${sectionCampo.title.replace(/ /g, '_')}`,
            value: sectionCampo.value || '',
            tipo: sectionCampo.tipo,
            opciones: sectionCampo.opciones || [],
            id: sectionCampo.id,
            placeholder: sectionCampo.placeholder,
            date: sectionCampo.date,
            Observaciones: sectionCampo.observation,
          })

          if (sectionCampo.observation) {
            formArray.push({
              formName: `${sectionCampo.title.replace(
                / /g,
                '_',
              )}_observaciones`,
              title: `${sectionCampo.title.replace(/ /g, '_')}_observaciones`,
              value: '',
              tipo: 'Observaciones',
              id: sectionCampo.id,
              placeholder: sectionCampo.placeholder,
            })
          }
          if (sectionCampo.date) {
            formArray.push({
              formName: `${sectionCampo.title.replace(/ /g, '_')}_fecha`,
              title: `${sectionCampo.title.replace(/ /g, '_')}_fecha`,
              value: '',
              tipo: 'Fecha',
              id: sectionCampo.id,
              placeholder: sectionCampo.placeholder,
            })
          }
        })

        if (campo.date) {
          formArray.push({
            formName: `${campo.title.replace(/ /g, '_')}_fecha`,
            title: `${campo.title.replace(/ /g, '_')}_fecha`,
            value: '',
            tipo: 'SectionDate',
            id: campo.id,
            placeholder: campo.placeholder,
          })
        }

        if (campo.observation) {
          formArray.push({
            formName: `${campo.title.replace(/ /g, '_')}_observaciones`,
            title: `${campo.title.replace(/ /g, '_')}_observaciones`,
            value: '',
            tipo: 'SectionObservaciones',
            id: campo.id,
            placeholder: campo.placeholder,
          })
        }
        formArray.push({
          formName: `fin_seccion_${campo.title.replace(/ /g, '_')}`,
          title: '',
          value: '',
          tipo: 'Separador',
          id: '',
          placeholder: '',
        })
      }
    })
  }

  return formArray
}

export const buildFormSchema = (formObject: any[]) => {
  const formSchema: { [key: string]: any } = {}

  formObject.forEach(campo => {
    const formattedTitle = campo.title.replace(/ /g, '_')
    const displayTitle = campo.title.replace(/_/g, ' ')
    switch (campo.tipo) {
      case 'Si-No':
        formSchema[formattedTitle] = z.enum(campo.opciones, {
          required_error: `El campo "${displayTitle}" es obligatorio`,
          invalid_type_error: `El valor ingresado en "${displayTitle}" no es válido`,
        })
        break
      case 'Texto':
        formSchema[formattedTitle] = z
          .string({
            required_error: `El campo "${displayTitle}" es obligatorio`,
          })
          .min(1, `El campo "${displayTitle}" no puede estar vacío`)
        break
      case 'Área de texto':
        formSchema[formattedTitle] = z
          .string({
            required_error: `El campo "${displayTitle}" es obligatorio`,
          })
          .min(1, `El campo "${displayTitle}" no puede estar vacío`)
        break
      case 'Radio':
        formSchema[formattedTitle] = z.enum(campo.opciones, {
          required_error: `El campo "${displayTitle}" es obligatorio`,
          invalid_type_error: `El valor ingresado en "${displayTitle}" no es válido`,
        })
        break
      case 'Seleccion multiple':
        formSchema[formattedTitle] = z
          .array(
            z.string({
              required_error: `El campo "${displayTitle}" es obligatorio`,
            }),
            {
              required_error: `El campo "${displayTitle}" es obligatorio`,
            },
          )
          .min(1, `El campo "${displayTitle}" no puede estar vacío`)
        break
      case 'Fecha':
        formSchema[formattedTitle] = z.string({
          required_error: `El campo "${displayTitle}" es obligatorio`,
        })
        break
      case 'Seleccion':
        formSchema[formattedTitle] = z.string({
          required_error: `Por favor, selecciona una opción para el campo "${displayTitle}"`,
        })
        break
      case 'Seleccion Predefinida':
        formSchema[formattedTitle] = z.string({
          required_error: `Por favor, selecciona una opción para el campo "${displayTitle}"`,
        })
        break
      case 'Observaciones':
        formSchema[`${formattedTitle}`] = z
          .string({
            required_error: `El campo "${displayTitle}" es obligatorio`,
          })
          .min(
            1,
            `El campo "${displayTitle} - Observaciones" no puede estar vacío`,
          )
      case 'SectionDate':
        formSchema[formattedTitle] = z.string({
          required_error: `El campo "${displayTitle}" es obligatorio`,
        })
        break
      case 'SectionObservaciones':
        formSchema[`${formattedTitle}`] = z
          .string({
            required_error: `El campo "${displayTitle}" es obligatorio`,
          })
          .min(
            1,
            `El campo "${displayTitle} - Observaciones" no puede estar vacío`,
          )
        break
      default:
        break
    }
  })

  const finalFormSchema = z.object(formSchema)
  return finalFormSchema
}
