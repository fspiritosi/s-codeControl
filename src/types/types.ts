import React from 'react';
import { UseFormReturn } from 'react-hook-form';

export type LoggedUser = {
  session: null | string;
  user: {
    app_metadata: {
      provider: string;
      providers: string[];
    };
    aud: string;
    confirmation_sent_at: string;
    created_at: string;
    email: string;
    id: string;
    identities: any[];
    phone: string;
    role: string;
    updated_at: string;
    user_metadata: Record<string, unknown>;
  } | null;
};

export type Notifications = {
  id: string;
  title: string;
  description: string;
  category: string;
  company_id: string;
  created_at: Date;
  document_id: string;
  reference: string;
  document: DocumentInsert;
};

export type DocumentInsert = {
  date: string;
  allocated_to: string;
  documentName: string;
  state: string;
  multiresource: string;
  validity: string;
  mandatory: string;
  id: string;
  resource: string;
  document_number: string;
};

export type profileUser = {
  id?: string;
  created_at?: string;
  firstname: string;
  lastname: string;
  credential_id: string;
  email: string;
  avatar?: string;
  fullname?: string;
  role: string;
};

export type company = {
  id?: string;
  company_name: string;
  company_cuit: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: {
    id: number;
    name: string;
  };
  country: string;
  industry: string;
  company_logo: string;
  province_id: {
    id: number;
    name: string;
  };
  by_defect: boolean;
  owner_id: string | undefined;
};

export type industry_type = {
  id: number;
  name: string;
}[];

export type singUp = {
  email: string;
  password: string;
};

export type login = {
  email: string;
  password: string;
};

export type MotionTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export type names =
  | 'lastname'
  | 'firstname'
  | 'nationality'
  | 'cuil'
  | 'document_type'
  | 'document_number'
  | 'birthplace'
  | 'gender'
  | 'marital_status'
  | 'level_of_education'
  | 'picture'
  | 'covenants_id'
  | 'category_id'
  | 'guild_id';

export type Employee = {
  id?: string;
  lastname: string;
  firstname: string;
  nationality: string | undefined;
  cuil: string; //!si
  document_type: string | undefined;
  document_number: string; //!si
  birthplace: string | undefined;
  gender: string | undefined;
  marital_status: string | undefined;
  level_of_education: string | undefined; //!si
  picture?: string | undefined;
  street: string;
  street_number: string;
  province: string | undefined;
  city: string | undefined;
  postal_code: string;
  phone: string;
  email?: string; //!si
  file: undefined | null | string | number;
  hierarchical_position: string | undefined; //!si
  company_position: string; //!si
  workflow_diagram: string;
  normal_hours: string; //!si
  type_of_contract: string | undefined; //!si
  allocated_to?: any; //!si
  date_of_admission: Date | undefined | string;
  full_name?: string; //!si
  is_active?: boolean;
  reason_for_termination?: string | undefined;
  termination_date?: Date | undefined | string;
  status?: 'Avalado' | 'No avalado';
  guild?: string | null;
  covenant?: string | null;
  category?: string | null;
};

export type Documents = {
  id: string;
  id_storage: string | null;
  id_document_types: string | null;
  applies: string | null;
  validity: Date | null;
  state: string;
  is_active: boolean;
  user_id: string | undefined;
  document_url: string | null;
};

export type SharedUser = {
  id: string;
  role: string;
  email: string;
  avatar: string;
  fullname: string;
  created_at: Date;
  credential_id: string;
  profile_id: profileUser;
  customer_id: {
    id: string;
    cuit: number;
    name: string;
    address: string;
    is_active: boolean;
    company_id: string;
    created_at: string;
    client_email: string;
    client_phone: number;
    termination_date: null | string;
    reason_for_termination: null | string;
  };
};

export type TypeOfVehicle = {
  id: string;
  name: string;
  created_at: string;
};
export type Brand = {
  id: string;
  name: string;
  created_at: string;
};
export type Model = {
  id: string;
  name: string;
  created_at: string;
};

export type Vechicle = {
  id: string;
  created_at: string;
  picture: string;
  type_of_vehicle: TypeOfVehicle;
  domain: string;
  chassis: string;
  engine: string;
  serie: string;
  intern_number: string;
  year: string;
  brand: Brand;
  model: Model;
  company_id: string;
  is_active: boolean;
  termination_date: string;
  reason_for_termination: string;
  user_id: string;
  status: 'Avalado' | 'No avalado';
  kilometer: string;
  type: Model;
  condition: 'operativo' | 'no operativo' | 'en reparación' | 'operativo condicionado';
};

type Resource = Vechicle | Employee;

type DocumentType = {
  id: string;
  name: string;
  description: string;
  applies: 'Equipos' | 'Persona';
  multiresource: boolean;
  mandatory: boolean;
  expired: boolean;
  special: boolean;
  is_active: boolean;
  created_at: string;
};

type Document2 = {
  id: string;
  created_at: string;
  id_storage: string;
  id_document_types: DocumentType;
  validity: string;
  state: 'presentado' | 'rechazado' | 'aprobado' | 'vencido';
  is_active: boolean;
  user_id: string;
  applies: Resource;
  document_url: string;
};

export type AuditorDocument = {
  date: string;
  companyName: string;
  allocated_to: string;
  documentName: string;
  multiresource: string;
  validity: string;
  id: string;
  resource: string;
  state: string;
};

export type VehiclesAPI = {
  created_at: Date;
  id_storage: null;
  id_document_types: string;
  applies: Applies;
  validity: null | string;
  state: string;
  is_active: boolean;
  id: string;
  user_id: string;
  document_url: string;
  document_types: DocumentTypes;
  period: string;
};

export type Applies = {
  id: string;
  type: Type;
  year: string;
  brand: Brand;
  model: Brand;
  serie: string;
  domain: string;
  engine: string;
  status: string;
  chassis: string;
  picture: string;
  user_id: string;
  is_active: boolean;
  company_id: string;
  created_at: Date;
  intern_number: string;
  type_of_vehicle: Brand;
  termination_date: null;
  reason_for_termination: null;
};

export type Type = {
  id: string;
  name: string;
  created_at: Date;
};
export enum types {
  Texto = 'Texto',
  AreaTexto = 'Área de texto',
  Separador = 'Separador',
  NombreFormulario = 'Nombre del formulario',
  Radio = 'Radio',
  SeleccionMultiple = 'Seleccion multiple',
  Date = 'Fecha',
  Seleccion = 'Seleccion',
  SeleccionPredefinida = 'Seleccion Predefinida',
  Subtitulo = 'Subtitulo',
  SiNo = 'Si-No',
  Titulo = 'Titulo',
  Seccion = 'Seccion',
  Archivo = 'Archivo',
  Observaciones = 'Observaciones',
  SectionDate = 'SectionDate',
  SectionObservaciones = 'SectionObservaciones',
}

export type DocumentTypes = {
  id: string;
  name: string;
  applies: string;
  special: boolean;
  explired: boolean;
  is_active: boolean;
  mandatory: boolean;
  created_at: Date;
  description: null;
  multiresource: boolean;
  private: boolean;
  down_document: boolean;
};
export type DocumentsTable = {
  created_at: Date;
  id_storage: null;
  id_document_types: string;
  applies: string;
  validity: string;
  state: string;
  is_active: boolean;
  id: string;
  user_id: string;
  document_url: string;
  vehicles: VehiclesTable;
  document_types: DocumentTypes;
  domain: string;
};
export interface Campo {
  tipo: types;
  placeholder?: string;
  opciones: string[];
  value?: string;
  id: string;
  title: string;
  observation?: boolean;
  date?: boolean;
  sectionCampos?: Campo[];
  formName?: string;
  required?: boolean;
  apply?: string;
}
export interface FormField {
  formName?: string;
  title: string;
  value?: string;
  tipo: string;
  opciones?: string[];
  date?: boolean;
  id: string;
  placeholder?: string;
  Observaciones?: boolean;
  observation?: boolean;
  required?: boolean;
}

export interface Document {
  date: string;
  allocated_to: string;
  documentName: string;
  multiresource: string;
  validity: string;
  id: string;
  resource: string;
  state: string;
  document_path?: string;
  is_active: boolean;
  isItMonthly: boolean;
  applies: string;
  mandatory: string;
  id_document_types?: string;
}

export type DocumentTypesTable = {
  id: string;
  name: string;
};

export type VehiclesTable = {
  id: string;
  domain: string;
  company_id: string;
  intern_number: string;
};

export type AllDocumentsValues = {
  id_document_types: string;
  validity: Date;
  document: string;
  applies: string;
  document_url: string;
  id_storage: null;
  is_active: boolean;
  user_id: string;
};

export interface FieldComponentProps {
  campo: FormField;
  form: UseFormReturn<any> | null;
  index: number;
  completObjet: FormField[] | null;
}

export interface FieldComponentPropsDecorative {
  campo: FormField;
  index: number;
}

export interface SectionCampo {
  id: string;
  date: boolean;
  tipo: string;
  title: string;
  opciones: string[];
  required: boolean;
  observation: boolean;
  placeholder: string;
  value?: string; // opcional ya que algunos campos no tienen 'value'
}

export interface FormField {
  id: string;
  tipo: string;
  title: string;
  value?: string; // opcional ya que algunos campos no tienen 'value'
  opciones?: string[];
  placeholder?: string;
  required?: boolean; // opcional ya que algunos campos no tienen 'required'
  observation?: boolean; // opcional ya que algunos campos no tienen 'observation'
  date?: boolean; // opcional ya que algunos campos no tienen 'date'
  sectionCampos?: SectionCampo[]; // opcional ya que algunos campos no tienen 'sectionCampos'
}

export interface FormData {
  id: string;
  created_at: string;
  company_id: string;
  form: FormField[];
  name: string;
}

export type EmployeesTableOptions = {
  nationality: string;
  lastname: string;
  firstname: string;
  cuil: string;
  document_type: string;
  document_number: string;
  birthplace: string;
  gender: string;
  marital_status: string;
  level_of_education: string;
  province: string;
  file: string;
  normal_hours: string;
  date_of_admission: string;
  affiliate_status: string;
  company_position: string;
  hierarchical_position: string;
  workflow_diagram: string;
  type_of_contract: string;
  allocated_to: string;
  status: string;
  created_at: string;
  is_active: string;
};

export type VehiclesTableOptions = {
  created_at: string;
  type_of_vehicle: string;
  domain: string;
  chassis: string;
  engine: string;
  serie: string;
  intern_number: string;
  year: string;
  brand: string;
  model: string;
  is_active: string;
  termination_date: string;
  reason_for_termination: string;
  type: string;
  status: string;
  allocated_to: string;
};

export type CompaniesTableOptions = {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  industry: string;
  company_logo: string;
  company_cuit: string;
};

export type DocumentsTableOptions = {
  created_at: string;
  name: string;
  applies: string;
  multiresource: string;
  mandatory: string;
  explired: string;
  special: string;
  description: string;
  is_it_montlhy: string;
  private: string;
  down_document: string;
};

export type TypeOfRepair = {
  id: string;
  created_at: string;
  name: string;
  description: string;
  criticity: 'Alta' | 'Media' | 'Baja';
  is_active: boolean;
  company_id: string;
  type_of_maintenance: 'Preventivo' | 'Correctivo';
}[];

export type RepairsSolicituds = {
  id: string;
  created_at: string;
  state: 'Pendiente' | 'Esperando repuestos' | 'En reparación' | 'Finalizado' | 'Rechazado' | 'Cancelado';
  user_description: string;
  mechanic_description: null | string;
  end_date: null | Date;
  user_id: string;
  mechanic_id: null | string;
  reparation_type: TypeOfRepair[0];
  equipment_id: Vechicle;
  user_images: string[];
  mechanic_images: string[];
  vehicle_id: string;
  vehicle_condition: 'operativo' | 'no operativo' | 'en reparación' | 'operativo condicionado';
  intern_number: string;
  kilometer: string | null;
  repairlogs:
    | {
        id: string;
        title: string;
        repair_id: string;
        created_at: string;
        description: string;
        employee_id?: Employee;
        user_id?: {
          id: string;
          role: string;
          email: string;
          avatar: null | string;
          fullname: string;
          created_at: string;
          credential_id: string;
        };
      }[]
    | [];
}[];

export type FormattedSolicitudesRepair = {
  id: string;
  title: string;
  state: 'Pendiente' | 'Esperando repuestos' | 'En reparación' | 'Finalizado' | 'Rechazado' | 'Cancelado';
  label: string;
  priority: 'Alta' | 'Media' | 'Baja';
  created_at: string;
  equipment: string;
  user_description: string;
  year: string;
  brand: string;
  model: string;
  domain: string | null;
  engine: string;
  status: string;
  kilometer: string | null;
  serie: string;
  chassis: string;
  picture: string;
  solicitud_status: string;
  type_of_maintenance: string;
  type_of_equipment: string;
  user_images: string[];
  intern_number: string;
  vehicle_id: string;
  mechanic_images: string[];
  repairlogs:
    | {
        kilometer?: any;
        id: string;
        title: string;
        repair_id: string;
        created_at: string;
        description: string;
        modified_by_employee?: Employee;
        modified_by_user?: {
          id: string;
          role: string;
          email: string;
          avatar: null | string;
          fullname: string;
          created_at: string;
          credential_id: string;
        };
      }[]
    | [];
  mechanic_description: string | null;
  vehicle_condition: 'operativo' | 'no operativo' | 'en reparación' | 'operativo condicionado';
}[];

// Tipo para las categorías dentro de un convenio
export type Category = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  covenant_id: string;
};

// Tipo para los convenios dentro de un sindicato
export type Covenant = {
  id: string;
  name: string;
  category: Category[];
  guild_id: string;
  is_active: boolean;
  company_id: string;
  created_at: string;
};

// Tipo para el objeto de entrada que representa un sindicato
export type Guild = {
  id: string;
  created_at: string;
  name: string;
  company_id: string;
  is_active: boolean;
  covenant: Covenant[];
};

// Tipo para una categoría formateada en el objeto de salida
export type FormattedCategory = {
  name: string;
  type: 'categoria';
  id: string;
};

// Tipo para un convenio formateado en el objeto de salida
export type FormattedCovenant = {
  name: string;
  type: 'convenio';
  id: string;
  children: FormattedCategory[];
};

// Tipo para un sindicato formateado en el objeto de salida
export type FormattedGuild = {
  name: string;
  type: 'sindicato';
  id: string;
  children: FormattedCovenant[];
};

// Tipo para la función de salida completa
export type FormattedOutput = FormattedGuild[] | undefined;
