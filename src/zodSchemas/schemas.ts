import * as z from 'zod'
import { supabase } from '../../supabase/supabase'

const getAllFiles = async (legajo:string) => {

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = await supabase
  .from('profile')
  .select('*')
  .eq('credential_id', user?.id)


  const {data} = await supabase.
  from('company')
  .select('*')
  .eq('owner_id',profile.data?.[0].id)


  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    // .eq('company_id', data?.[0].id)
    .eq('file', legajo)

    if (employee && employee.length > 0) {
      return true
    } else {
      return true
    }
}



// const AllFiles = 

const passwordSchema = z
  .string()
  .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  .max(50, { message: 'La contraseña debe tener menos de 50 caracteres.' })
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
  email: z.string().email({ message: 'Email inválido' }),
  password: passwordSchema,
})

export const employeeSchema = z.object({
  name: z.string().max(25, { message: 'El nombre debe tener menos de 25 caracteres.' })
})

export const registerSchema = z
  .object({
    firstname: z
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
    lastname: z
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
    email: z.string().email({ message: 'Email inválido' }),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const recoveryPassSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
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
  }).max(15, { message: 'La compañia debe tener menos de 15 caracteres.' }),
  company_cuit: z
    .string()
    .refine(value => /^\d{11}$/.test(value), {
        message: 'El CUIT debe contener 11 números.',
    }),

  description: z.string().max(200),
  website: z.string().refine((value) => {
    if (value === '') return true;

    const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/i;

    return urlRegex.test(value);
  }, {
    message: "La URL proporcionada no es válida."
  }), 
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
  province_id: z.any(),
  industry: z.string(),
    
  city: z.any(),
  company_logo: z.string().optional(),
  by_defect:z.boolean()
  //employees_id: z.string().nullable(),
})

export const accordionSchema = z.object({
  full_name: z.string().min(2, {}).optional(),
  lastname: z.string().min(2, {
    message: 'El apellido debe tener al menos 2 caracteres.',
  }).max(15, { message: 'La compañia debe tener menos de 15 caracteres.' }),
  firstname: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }).max(15, { message: 'La compañia debe tener menos de 15 caracteres.' }),
  nationality: z.string({
    required_error: "La nacionalidad es requerida",
  }),
  cuil: z.string().refine(
    value => value.length === 13 && value[2] === '-' && value[11] === '-',
    {
      message: 'El CUIT se debe ingresar con el formato xx-xxxxxxxx-x',
    },
  ),
  document_type: z.string({
    required_error: "El tipo de documento es requerido"
  }),
  document_number: z.string().min(7, {
    message: 'El documento debe tener al menos 7 caracteres.',
  }).max(10, {
    message: 'El documento debe tener menos de 11 caracteres.',
  }),
  birthplace: z.string({
    required_error: "El lugar de nacimiento es requerido"
  }),
  gender: z.string({
    required_error: "El género es requerido"
  }),
  marital_status: z.string({
    required_error: "El estado civil es requerido"
  }),
  level_of_education: z.string({
    required_error: "El nivel de educación es requerido"
  }),
  picture: z.string().optional(),
  street: z.string().min(2, {
    message: 'La calle debe tener al menos 2 caracteres.',
  }).max(30, { message: 'La compañia debe tener menos de 30 caracteres.' }),
  street_number: z.string().min(1, {
    message: 'El número debe tener al menos 1 caracteres.',
  }).max(7, { message: 'La compañia debe tener menos de 7 caracteres.' }),
  province: z.string({
    required_error: "La provincia es requerida"
  }),
  city: z.string({
    required_error: "La ciudad es requerida"
  }),
  postal_code: z.string().min(4, {
    message: 'El código postal debe tener al menos 4 caracteres.',
  }).max(15, { message: 'La compañia debe tener menos de 15 caracteres.' }),
  phone: z.string().min(4, {
    message: 'El teléfono debe tener al menos 4 caracteres.',
  }).max(15, {
    message: 'El teléfono debe tener menos de 15 caracteres.',
  }),
  email: z.string().email({
    message: 'Email inválido'
  }).optional(),
  file: z.string({
    description: 'El número de legajo es obligatorio'
  })
    .regex(/^[0-9]+$/, {
      message: 'No se pueden ingresar valores negativos ni símbolos'
    })
    .max(10, {
      message: "El legajo no debe tener más de 10 caracteres"
    })
    .min(1, {
      message: 'El legajo debe contener al menos un número'
    })
    .refine(async (value) => {
      return await getAllFiles(value)
    }, {
      message: "El legajo ya existe"
    }),
  hierarchical_position: z.string({
    required_error: "El cargo jerárquico es requerido"
  }),
  company_position: z.string().min(3, {
    message: 'El cargo debe tener al menos 3 caracteres.',
  }).max(15, { message: 'La compañia debe tener menos de 15 caracteres.' }),
  workflow_diagram: z.string({required_error: "El diagrama de flujo es requerido"}),
  normal_hours: z.string().max(3, { message: 'La compañia debe tener menos de 3 caracteres.' }).refine((value) => value.trim().length > 0, {
    message: 'Las horas normales son requeridas',
  }),
  type_of_contract: z.string({required_error: "El tipo de contrato es requerido"}),
  allocated_to: z.array(z.string()).optional(),
  date_of_admission: z.date({
    required_error: "La fecha de ingreso es requerida",
  }).optional(),
})


export const vehicleSchema = z.object({
  brand: z.string({
    required_error: 'La marca es requerida',
  }),
  model: z.string({
    required_error: 'El modelo es requerido',
  }),
  year: z.number({required_error: 'El año es requerido'
  }).min(1900, {
    message: 'El año debe ser mayor a 1900',
  }).max(2023, {
    message: 'El año debe ser menor a 2023',
  }).or(z.string()),
  engine: z.string({
    required_error: 'El motor es requerido',
  }).min(2, {
    message: 'El motor debe tener al menos 2 caracteres.',
  }).max(15, { message: 'El motor debe tener menos de 15 caracteres.' }),
  type_of_vehicle: z.string({required_error: 'El tipo es requerido'}),
  chassis: z.string({
    required_error: 'El chasis es requerido',
  }).min(2, {
    message: 'El chasis debe tener al menos 2 caracteres.',
  }).max(15, { message: 'El chasis debe tener menos de 15 caracteres.' }),
  domain: z.string({
    required_error: 'El dominio es requerido',
  }).min(3, {
    message: 'El dominio debe tener al menos 3 caracteres.',
  }).max(7, { message: 'El dominio debe tener menos de 7 caracteres.' }),
  serie: z.string({
    required_error: 'La serie es requerida',
  }).min(3, { 
    message: 'La serie debe tener al menos 3 caracteres.',
  }).max(15, { message: 'La serie debe tener menos de 15 caracteres.' }),
  intern_number: z.string({
    required_error: 'El número interno es requerido',
  }).min(2, {
    message: 'El número interno debe tener al menos 2 caracteres.',
  }).max(15, {
    message: 'El número interno debe tener menos de 15 caracteres.',
  }),
  picture: z.string({required_error: 'La imagen es requerida'}).min(10, {
    message: 'La imagen debe tener al menos 10 caracteres.',
  }),

})