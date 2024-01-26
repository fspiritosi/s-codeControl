import * as z from 'zod'

const passwordSchema = z
  .string()
  .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  .regex(/[A-Z]/, {
    message: 'La contraseña debe tener al menos una mayúscula.',
  })
  .regex(/[a-z]/, {
    message: 'La contraseña debe tener al menos una minúscula.',
  })
  .regex(/[0-9]/, { message: 'La contraseña debe tener al menos un número.' })
  .regex(/[^A-Za-z0-9]/, {
    message: 'La contraseña debe tener al menos un carácter especial.',
  })

  export const loginSchema = z.object({
    email: z.string().email({ message: 'Email invalido' }),
    password:passwordSchema,
  })
  
  export const employeeSchema = z.object({
    name: z.string()
  })

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, {
        message: 'El nombre debe tener al menos 2 caracteres.',
      })
      .max(20, {
        message: 'El nombre debe tener menos de 20 caracteres.',
      })
      .regex(/^[a-zA-Z ]+$/, {
        message: 'El nombre solo puede contener letras.',
      })
      .trim(),
    lastName: z
      .string()
      .min(2, {
        message: 'El apellido debe tener al menos 2 caracteres.',
      })
      .max(20, {
        message: 'El apellido debe tener menos de 20 caracteres.',
      })
      .regex(/^[a-zA-Z ]+$/, {
        message: 'El apellido solo puede contener letras.',
      })
      .trim(),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const recoveryPassSchema = z.object({
  email: z.string().email({ message: 'Email invalido' }),
})
export const changePassSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const companySchema = z.object({
  company_name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  company_cuit: z
    .string()
    .refine(
      value => value.length === 13 && value[2] === '-' && value[11] === '-',
      {
        message: 'El CUIT se debe ingresar con el formato xx-xxxxxxxx-x',
      },
    ),
  description: z.string().max(200),
  website: z.string().url(), 
  contact_email: z.string().email(),
  contact_phone: z.string().refine(value => /^\+?[0-9]{1,25}$/.test(value), {
    message:
      'El número de teléfono debe contener solo números',
  }),
  address: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9\s]*$/, {
      message:
        'Address debe contener solo letras y números y tener hasta 50 caracteres',
    }),
  country: z.string(),
  province_id: z.number(),
  industry: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z\s]{1,50}$/, {
      message:
        'Industry debe contener solo letras y espacios, con un límite de hasta 50 caracteres',
    }),
  city: z.number(),

  company_logo: z.string(),
  employees: z.string().nullable(),
})

export const accordionSchema = z.object({
  lastname: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  firstname: z.string().min(2, {
    message: 'El apellido debe tener al menos 2 caracteres.',
  }),
  nationality: z.enum(['Argentino', 'Extranjero'],{
    invalid_type_error: 'Nacionalidad invalida'
  }),
  cuil: z
  .string()
  .refine(
    value => value.length === 13 && value[2] === '-' && value[11] === '-',
    {
      message: 'El CUIT se debe ingresar con el formato xx-xxxxxxxx-x',
    },
  ),
  document_type: z.enum(['DNI', 'PASAPORTE','LC','LE'],{
    invalid_type_error: 'Tipo de documento invalido'
  }),
  document_number: z
  .string()
  .min(7, {
    message: 'El documento debe tener al menos 7 caracteres.',
  })
  .max(9999999999, {
    message: 'El documento debe tener menos de 11 caracteres.',
  }),
  birthplace: z.string(),
  genre: z.enum(['Masculino', 'Femenino', 'Otro'],{
    invalid_type_error: 'Genero invalido'
  }),
  marital_status: z.enum(['Soltero', 'Casado', 'Divorciado', 'Viudo'],{
    invalid_type_error: 'Estado civil invalido'
  }),
  level_of_education: z.enum(['Primario', 'Secundario', 'Terciario', 'Universitario','Posgrado'],{
    invalid_type_error: 'Nivel de educacion invalido'
  }),
  picture: z
  .string().optional()
  // .refine((value) => value.trim().length > 0, {
  //   message: 'El archivo no puede estar vacío.',
  // }),
  ,
  street : z.string().min(2, {
    message: 'La calle debe tener al menos 2 caracteres.',
 }),
 street_number : z.string().min(1, {
    message: 'El número debe tener al menos 1 caracteres.',
 }),
 province: z.string(),
 city: z.string(),
 postal_code: z.string().min(4, {
    message: 'El código postal debe tener al menos 4 caracteres.',
 })
 ,
 phone : z.string().min(4, {
    message: 'El teléfono debe tener al menos 4 caracteres.',
 }),
 email: z.string().email(),
 file: z.string().refine((value) => value.trim().length > 0, {
  message: 'El archivo no puede estar vacío.',
 }),
 hierarchical_position: z.enum(['Director', 'Supervisor', 'Gerente','Operativo','Administrativo'],{
  invalid_type_error: 'Posicion jerarquica invalida'
 }),
 company_position: z.string().min(3, {
  message: 'El cargo debe tener al menos 3 caracteres.',
 }),
 workflow_diagram: z.string().refine((value) => value.trim().length > 0, {
  message: 'El archivo no puede estar vacío.',
 }),
 normal_hours: z.string().refine((value) => value.trim().length > 0, {
  message: 'El archivo no puede estar vacío.',
 }),
 type_of_contract: z.enum(['Período de prueba', 'A tiempo indeterminado', 'Plazo fijo'],{
  invalid_type_error: 'Tipo de contrato invalido'
 }),
 allocated_to: z.string().min(3, {
  message: 'El cargo debe tener al menos 3 caracteres.',
 }),
 date_of_admission: z.string(),
})
