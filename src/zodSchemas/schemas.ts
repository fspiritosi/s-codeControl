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
    document: z
      .string()
      .min(7, {
        message: 'El documento debe tener al menos 7 caracteres.',
      })
      .max(9999999999, {
        message: 'El documento debe tener menos de 11 caracteres.',
      }),
    birthdate: z.string(),
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
    confirmPassword: passwordSchema
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
      'Phone debe contener solo números y opcionalmente un signo + al principio, con un límite de hasta 25 caracteres',
  }),
  address: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9\s]*$/, {
      message:
        'Address debe contener solo letras y números y tener hasta 50 caracteres',
    }),
  city: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z\s]{1,50}$/, {
      message:
        'City debe contener solo letras y espacios, con un límite de hasta 50 caracteres',
    }),
  country: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z\s]{1,50}$/, {
      message:
        'Country debe contener solo letras y espacios, con un límite de hasta 50 caracteres',
    }),
  industry: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z\s]{1,50}$/, {
      message:
        'Industry debe contener solo letras y espacios, con un límite de hasta 50 caracteres',
    }),
  company_logo: z
    .string()
    .url()
    .refine(
      value => value.startsWith('http://') || value.startsWith('https://'),
      {
        message: 'Company logo debe contener una URL válida',
      },
    ),
})
