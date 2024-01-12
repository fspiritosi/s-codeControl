import * as z from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email invalido' }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
  }),
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
    password: z.string().min(6, {
      message: 'La contraseña debe tener al menos 6 caracteres.',
    }),
    confirmPassword: z
      .string()
      .min(6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
      })
      .trim(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })
