import { validarCUIL } from '@/lib/utils';
import * as z from 'zod';
import { supabase } from '../../supabase/supabase';

const getAllFiles = async (legajo: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await supabase.from('profile').select('*').eq('credential_id', user?.id);

  const { data } = await supabase.from('company').select('*').eq('owner_id', profile.data?.[0].id);

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    // .eq('company_id', data?.[0].id)
    .eq('file', legajo);

  if (employee && employee.length > 0) {
    return true;
  } else {
    return true;
  }
};

const validateDuplicatedCuil = async (cuil: string) => {
  const { data: employees } = await supabase.from('company').select('*').eq('company_cuit', cuil);

  if (employees && employees.length > 0) {
    return false;
  } else {
    return true;
  }
};

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
  });

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: passwordSchema,
});

export const employeeSchema = z.object({
  name: z.string().max(25, { message: 'El nombre debe tener menos de 25 caracteres.' }),
});

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
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const recoveryPassSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
});

export const changePassSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const companySchema = z.object({
  company_name: z
    .string({ required_error: 'El nombre de la compañía es requerido' })
    .min(2, {
      message: 'El nombre debe tener al menos 2 caracteres.',
    })
    .max(30, { message: 'La compañia debe tener menos de 30 caracteres.' }),
  company_cuit: z
    .string()
    .refine((value) => /^\d{11}$/.test(value), {
      message: 'El CUIT debe contener 11 números.',
    })
    .refine(
      (cuil) => {
        return validarCUIL(cuil);
      },
      { message: 'El CUIT es inválido' }
    )
    .refine(
      async (value) => {
        return await validateDuplicatedCuil(value);
      },
      {
        message: 'Ya existe una compañía con este CUIT.',
      }
    ),

  description: z
    .string()
    .min(3, {
      message: 'La descripción debe tener al menos 3 caracteres.',
    })
    .max(200, {
      message: 'La descripción debe tener menos de 200 caracteres.',
    }),
  website: z
    .string()
    .refine(
      (value) => {
        if (value === '') return true;

        const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/i;

        return urlRegex.test(value);
      },
      {
        message: 'La URL proporcionada no es válida.',
      }
    )
    .optional(),
  contact_email: z.string().email({ message: 'Email inválido' }),
  contact_phone: z
    .string()
    .min(5, {
      message: 'El número de teléfono debe tener al menos 5 caracteres.',
    })
    .max(25, {
      message: 'El número de teléfono debe tener menos de 25 caracteres.',
    })
    .regex(/^\+?[0-9]{1,25}$/, {
      message: 'El número de teléfono debe contener solo números',
    })
    .refine((value) => /^\+?[0-9]{1,25}$/.test(value), {
      message: 'El número de teléfono debe contener solo números',
    }),
  address: z
    .string()
    .min(4, { message: 'Address debe tener al menos 4 caracteres.' })
    .max(50, {
      message: 'Address debe tener menos de 50 caracteres.',
    })
    .regex(/^[a-zA-Z0-9\s]*$/, {
      message: 'Address debe contener solo letras y números y tener hasta 50 caracteres',
    }),
  country: z.string().min(2, { message: 'Country debe tener al menos 2 caracteres.' }),
  province_id: z.string().min(1, { message: 'Province debe tener al menos 1 caracteres.' }),
  industry: z.string().min(2, { message: 'Industry debe tener al menos 2 caracteres.' }),
  city: z.string().min(1, { message: 'City debe tener al menos 1 caracteres.' }),
  company_logo: z.string().optional(),
  by_defect: z.boolean().optional(),
  //employees_id: z.string().nullable(),
});
export const editCompanySchema = z.object({
  company_name: z
    .string({ required_error: 'El nombre de la compañía es requerido' })
    .min(2, {
      message: 'El nombre debe tener al menos 2 caracteres.',
    })
    .max(30, { message: 'La compañia debe tener menos de 30 caracteres.' }),
  company_cuit: z
    .string()
    .refine((value) => /^\d{11}$/.test(value), {
      message: 'El CUIT debe contener 11 números.',
    })
    .refine(
      (cuil) => {
        return validarCUIL(cuil);
      },
      { message: 'El CUIT es inválido' }
    )
    .refine((value) => {
      return new Promise(async (resolve, reject) => {
        try {
          const isDuplicated = await validateDuplicatedCuil(value);
          if (!isDuplicated) {
            resolve(true);
          } else {
            reject(new Error('Ya existe una compañía con este CUIT.'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }),

  description: z
    .string()
    .min(3, {
      message: 'La descripción debe tener al menos 3 caracteres.',
    })
    .max(200, {
      message: 'La descripción debe tener menos de 200 caracteres.',
    }),
  website: z
    .string()
    .refine(
      (value) => {
        if (value === '') return true;

        const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/i;

        return urlRegex.test(value);
      },
      {
        message: 'La URL proporcionada no es válida.',
      }
    )
    .optional(),
  contact_email: z.string().email({ message: 'Email inválido' }),
  contact_phone: z
    .string()
    .min(5, {
      message: 'El número de teléfono debe tener al menos 5 caracteres.',
    })
    .max(25, {
      message: 'El número de teléfono debe tener menos de 25 caracteres.',
    })
    .regex(/^\+?[0-9]{1,25}$/, {
      message: 'El número de teléfono debe contener solo números',
    })
    .refine((value) => /^\+?[0-9]{1,25}$/.test(value), {
      message: 'El número de teléfono debe contener solo números',
    }),
  address: z
    .string()
    .min(4, { message: 'Address debe tener al menos 4 caracteres.' })
    .max(50, {
      message: 'Address debe tener menos de 50 caracteres.',
    })
    .regex(/^[a-zA-Z0-9\s]*$/, {
      message: 'Address debe contener solo letras y números y tener hasta 50 caracteres',
    }),
  country: z.string().min(2, { message: 'Country debe tener al menos 2 caracteres.' }),
  province_id: z.string().min(1, { message: 'Province debe tener al menos 1 caracteres.' }),
  industry: z.string().min(2, { message: 'Industry debe tener al menos 2 caracteres.' }),
  city: z.string().min(1, { message: 'City debe tener al menos 1 caracteres.' }),
  company_logo: z.string().optional(),
  by_defect: z.boolean().optional(),
});

export const accordionSchema = z
  .object({
    full_name: z.string().min(2, {}).optional(),
    lastname: z
      .string({ required_error: 'El apellido es requerido' })
      .min(2, {
        message: 'El apellido debe tener al menos 2 caracteres.',
      })
      .max(40, { message: 'El lastname debe tener menos de 40 caracteres.' }),
    firstname: z
      .string({ required_error: 'El nombre es requerido' })
      .min(2, {
        message: 'El nombre debe tener al menos 2 caracteres.',
      })
      .max(40, { message: 'La nombre debe tener menos de 40 caracteres.' }),
    nationality: z.string({
      required_error: 'La nacionalidad es requerida',
    }),
    cuil: z
      .string({ required_error: 'El cuil es requerido' })
      .refine((value) => /^\d{11}$/.test(value), {
        message: 'El CUIT debe contener 11 números.',
      })
      .refine(
        (cuil) => {
          return validarCUIL(cuil);
        },
        { message: 'El CUIT es inválido' }
      ),
    document_type: z.string({
      required_error: 'El tipo de documento es requerido',
    }),
    document_number: z
      .string({ required_error: 'El numero de documento es requerido' })
      .min(7, {
        message: 'El documento debe tener al menos 7 caracteres.',
      })
      .max(10, {
        message: 'El documento debe tener menos de 11 caracteres.',
      }),
    birthplace: z.string({
      required_error: 'El lugar de nacimiento es requerido',
    }),
    gender: z.string({
      required_error: 'El género es requerido',
    }),
    marital_status: z.string({
      required_error: 'El estado civil es requerido',
    }),
    level_of_education: z.string({
      required_error: 'El nivel de educación es requerido',
    }),
    picture: z.string().optional(),
    street: z
      .string({ required_error: 'la calle es requerida' })
      .min(2, {
        message: 'La calle debe tener al menos 2 caracteres.',
      })
      .max(30, { message: 'La compañia debe tener menos de 30 caracteres.' }),
    street_number: z
      .string({ required_error: 'la altura es requerida' })
      .min(1, {
        message: 'El número debe tener al menos 1 caracteres.',
      })
      .max(7, { message: 'La compañia debe tener menos de 7 caracteres.' }),
    province: z.string({
      required_error: 'La provincia es requerida',
    }),
    city: z.string({
      required_error: 'La ciudad es requerida',
    }),
    postal_code: z
      .string({ required_error: 'El codigo postal es requerido' })
      .min(4, {
        message: 'El código postal debe tener al menos 4 caracteres.',
      })
      .max(15, { message: 'La compañia debe tener menos de 15 caracteres.' }),
    phone: z
      .string({ required_error: 'El numero de teléfono es requerido' })
      .min(4, {
        message: 'El teléfono debe tener al menos 4 caracteres.',
      })
      .max(15, {
        message: 'El teléfono debe tener menos de 15 caracteres.',
      }),
    email: z
      .string()
      .email({
        message: 'Email inválido',
      })
      .optional(),
    file: z
      .string({
        required_error: 'El legajo es requerido',
      })
      .regex(/^[0-9]+$/, {
        message: 'No se pueden ingresar valores negativos ni símbolos',
      })
      .max(10, {
        message: 'El legajo no debe tener más de 10 caracteres',
      })
      .min(1, {
        message: 'El legajo debe contener al menos un número',
      })
      .refine(
        async (value) => {
          return await getAllFiles(value);
        },
        {
          message: 'El legajo ya existe',
        }
      ),
    hierarchical_position: z.string({
      required_error: 'El nivel jerárquico es requerido',
    }),
    company_position: z
      .string({
        required_error: 'El cargo es requerido',
      })
      .min(3, {
        message: 'El cargo debe tener al menos 3 caracteres.',
      })
      .max(50, { message: 'La compañia debe tener menos de 50 caracteres.' }),
    workflow_diagram: z.string({
      required_error: 'El diagrama de trabajo es requerido',
    }),
    normal_hours: z
      .string({ required_error: 'Las horas normales son requeridas' })
      .max(3, { message: 'La compañia debe tener menos de 3 caracteres.' }),
    type_of_contract: z.string({
      required_error: 'El tipo de contrato es requerido',
    }),
    allocated_to: z.array(z.string().optional()).optional().nullable(),
    guild_id: z.string().optional(),
    covenants_id: z.string().optional(),
    category_id: z.string().optional(),
    date_of_admission: z
      .date({
        required_error: 'La fecha de ingreso es requerida',
      })
      .or(z.string()),
  })
  .superRefine((data, context) => {
    if (!data.cuil.includes(data.document_number)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cuil'],
        message: 'El CUIL debe contener el número de documento.',
      });
    }
  });

export const ProfileSchema = z.object({
  id: z.string(),
  role: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  fullname: z.string(),
  created_at: z.coerce.date(),
  credential_id: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ShareCompanyUserSchema = z.object({
  id: z.string(),
  role: z.string(),
  profile: ProfileSchema,
  company_id: z.string(),
  created_at: z.coerce.date(),
  profile_id: z.string(),
});

export type ShareCompanyUser = z.infer<typeof ShareCompanyUserSchema>;

export const ContractorsSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Contractors = z.infer<typeof ContractorsSchema>;

export const ContractorEmployeeSchema = z.object({
  contractors: ContractorsSchema,
});
export type ContractorEmployee = z.infer<typeof ContractorEmployeeSchema>;

export const BirthplaceSchema = z.object({
  name: z.string(),
});
export type Birthplace = z.infer<typeof BirthplaceSchema>;

export const EmployeesSchema = z.object({
  id: z.string(),
  city: BirthplaceSchema,
  cuil: z.string(),
  file: z.string(),
  email: z.string(),
  phone: z.string(),
  gender: z.string(),
  status: z.string(),
  street: z.string(),
  picture: z.string(),
  lastname: z.string(),
  province: BirthplaceSchema,
  firstname: z.string(),
  is_active: z.boolean(),
  birthplace: BirthplaceSchema,
  company_id: z.string(),
  created_at: z.coerce.date(),
  nationality: z.string(),
  postal_code: z.string(),
  allocated_to: z.array(z.string()),
  normal_hours: z.string(),
  document_type: z.string(),
  street_number: z.string(),
  marital_status: z.string(),
  document_number: z.string(),
  affiliate_status: z.null() || z.string(),
  company_position: z.string(),
  termination_date: z.null() || z.string(),
  type_of_contract: z.string(),
  workflow_diagram: BirthplaceSchema,
  date_of_admission: z.string(),
  level_of_education: z.string(),
  contractor_employee: z.array(ContractorEmployeeSchema),
  hierarchical_position: BirthplaceSchema,
  reason_for_termination: z.null() || z.string(),
});
export type Employees = z.infer<typeof EmployeesSchema>;

export const CompaniesEmployeeSchema = z.object({
  employees: EmployeesSchema,
});
export type CompaniesEmployee = z.infer<typeof CompaniesEmployeeSchema>;

export const CitySchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type City = z.infer<typeof CitySchema>;

export const CompanySchema = z.array(
  z.object({
    id: z.string(),
    company_name: z.string(),
    description: z.string(),
    website: z.string(),
    contact_email: z.string(),
    contact_phone: z.string(),
    address: z.string(),
    city: CitySchema,
    country: z.string(),
    industry: z.string(),
    company_logo: z.string(),
    is_active: z.boolean(),
    company_cuit: z.string(),
    province_id: CitySchema,
    owner_id: ProfileSchema,
    by_defect: z.boolean(),
    share_company_users: z.array(ShareCompanyUserSchema) || null,
    companies_employees: z.array(CompaniesEmployeeSchema) || null,
  })
);
export type Company = z.infer<typeof CompanySchema>;

export const SharedUser = z.object({
  email: z.string(),
  fullname: z.string(),
  role: z.string(),
  alta: z.date().or(z.string()),
  id: z.string(),
  img: z.string(),
  customerName: z.string().optional(),
});

export type SharedUser = z.infer<typeof SharedUser>;

export const BrandVehiclesClassSchema = z.object({
  name: z.string(),
});
export type BrandVehiclesClass = z.infer<typeof BrandVehiclesClassSchema>;

export const VehicleSchema =
  z.array(
    z.object({
      created_at: z.coerce.date(),
      picture: z.string(),
      type_of_vehicle: z.number(),
      domain: z.string(),
      chassis: z.string(),
      engine: z.string(),
      serie: z.string(),
      intern_number: z.string(),
      year: z.string(),
      brand: z.number(),
      model: z.number(),
      is_active: z.boolean(),
      termination_date: z.null() || z.string(),
      reason_for_termination: z.null() || z.string(),
      user_id: z.string(),
      company_id: z.string(),
      id: z.string(),
      type: z.object({
        name: z.string(),
      }),
      status: z.string(),
      types_of_vehicles: BrandVehiclesClassSchema,
      brand_vehicles: BrandVehiclesClassSchema,
      model_vehicles: BrandVehiclesClassSchema,
      condition: z.enum(['operativo', 'no operativo', 'en reparación', 'operativo condicionado']),
      kilometer: z.string(),
    })
  ) || [];

export type Vehicle = z.infer<typeof VehicleSchema>;

export const VehiclesSchema = z.object({
  name: z.string(),
});
export type Vehicles = z.infer<typeof VehiclesSchema>;
export const VehiclesFormattedElementSchema = z.array(
  z.object({
    created_at: z.coerce.date(),
    picture: z.string(),
    type_of_vehicle: z.number(),
    domain: z.string(),
    chassis: z.string(),
    engine: z.string(),
    serie: z.string(),
    intern_number: z.string(),
    year: z.string(),
    brand: z.string(),
    model: z.string(),
    is_active: z.boolean(),
    termination_date: z.null() || z.string(),
    reason_for_termination: z.null() || z.string(),
    user_id: z.string(),
    company_id: z.string(),
    id: z.string(),
    type: z.string(),
    status: z.string(),
    types_of_vehicles: z.string(),
    brand_vehicles: VehiclesSchema,
    model_vehicles: VehiclesSchema,
  })
);
export type VehiclesFormattedElement = z.infer<typeof VehiclesFormattedElementSchema>;

export const EquipoSchema = z
  .array(
    z.object({
      id: z.string(),
      created_at: z.coerce.date(),
      name: z.string(),
      applies: z.string(),
      multiresource: z.boolean(),
      mandatory: z.boolean(),
      explired: z.boolean(),
      special: z.boolean(),
      is_active: z.boolean(),
      description: z.union([z.null(), z.string()]),
      company_id: z.string().optional().nullable(),
      is_it_montlhy: z.boolean().optional().nullable(),
      private: z.boolean().optional().nullable(),
      down_document: z.boolean().optional().nullable(),
      type: z.object({
        name: z.string(),
      }),
    })
  )
  .default([]);

export type Equipo = z.infer<typeof EquipoSchema>;

export const MandatoryDocumentsSchema = z.object({
  Persona: EquipoSchema,
  Equipos: EquipoSchema,
});
export type MandatoryDocuments = z.infer<typeof MandatoryDocumentsSchema>;

export const CompanyIdSchema =
  z.object({
    id: z.string(),
    city: CitySchema,
    address: z.string(),
    country: z.string(),
    website: z.string(),
    industry: z.string(),
    owner_id: ProfileSchema,
    by_defect: z.boolean(),
    is_active: z.boolean(),
    description: z.string(),
    province_id: CitySchema,
    company_cuit: z.string(),
    company_logo: z.string(),
    company_name: z.string(),
    contact_email: z.string(),
    contact_phone: z.string(),
    companies_employees: z.array(CompaniesEmployeeSchema) || null,
    share_company_users: z.array(ShareCompanyUserSchema) || null,
  }) || undefined;
export type CompanyId = z.infer<typeof CompanyIdSchema>;

export const SharedCompaniesSchema = z.array(
  z.object({
    created_at: z.coerce.date(),
    profile_id: z.string(),
    company_id: CompanyIdSchema,
    role: z.string(),
    id: z.string(),
  })
);

export const customersSchema = z.object({
  company_name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, {
      message: 'El nombre debe tener al menos 2 caracteres.',
    })
    .max(40, { message: 'EL nombre debe tener menos de 40 caracteres.' }),

  client_cuit: z
    .string({ required_error: 'El cuit es requerido' })
    .refine((value) => /^\d{11}$/.test(value), {
      message: 'El CUIT debe contener 11 números.',
    })
    .refine(
      (cuil) => {
        return validarCUIL(cuil);
      },
      { message: 'El CUIT es inválido' }
    ),

  address: z.string({ required_error: 'la calle es requerida' }).min(2, {
    message: 'La dirección debe tener al menos 2 caracteres.',
  }),

  client_phone: z
    .string({ required_error: 'El numero de teléfono es requerido' })
    .min(4, {
      message: 'El teléfono debe tener al menos 4 caracteres.',
    })
    .max(15, {
      message: 'El teléfono debe tener menos de 15 caracteres.',
    }),
  client_email: z
    .string()
    .email({
      message: 'Email inválido',
    })
    .optional(),
});

export const contactSchema = z.object({
  contact_name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, {
      message: 'El nombre debe tener al menos 2 caracteres.',
    })
    .max(40, { message: 'EL nombre debe tener menos de 40 caracteres.' }),

  contact_phone: z
    .string({ required_error: 'El numero de teléfono es requerido' })
    .min(4, {
      message: 'El teléfono debe tener al menos 4 caracteres.',
    })
    .max(15, {
      message: 'El teléfono debe tener menos de 15 caracteres.',
    }),
  contact_email: z
    .string()
    .email({
      message: 'Email inválido',
    })
    .optional(),
  contact_charge: z
    .string({ required_error: 'El cargo es requerido' })
    .min(4, {
      message: 'El cargo debe tener al menos 4 caracteres.',
    })
    .max(30, { message: 'EL cargo debe tener menos de 30 caracteres.' }),
  customer: z.string({ required_error: 'El cliente es requerido' }).optional(),
});

export const covenantSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, {
      message: 'El nombre debe tener al menos 2 caracteres.',
    })
    .max(100, { message: 'EL nombre debe tener menos de 100 caracteres.' }),
  category: z.string().optional(),
});

export const dailyReportSchema = z.object({
  customer: z.string().nonempty('El cliente es obligatorio'),
  services: z.string().nonempty('El servicio es obligatorio'),
  item: z.string().nonempty('El item es obligatorio'),
  employees: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  working_day: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  document_path: z.string().optional(),
}).refine((data) => {
  if (data.working_day === 'por horario') {
    return data.start_time && data.end_time;
  }
  return true;
}, {
  message: 'Debe ingresar start_time y end_time si working_day es igual a "por horario".',
  path: ['start_time', 'end_time'],
});
export type SharedCompanies = z.infer<typeof SharedCompaniesSchema>;
