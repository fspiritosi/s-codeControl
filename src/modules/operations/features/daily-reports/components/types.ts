export interface Customers {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Employee {
  id: string;
  firstname: string;
  lastname: string;
  allocated_to: string[];
  is_active: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  intern_number: number;
  allocated_to: string[];
  is_active: boolean;
  condition: 'operativo' | 'no operativo' | 'en reparación' | 'operativo condicionado';
}

export interface Services {
  service_validity: string | number | Date;
  service_start: string | number | Date;
  id: string;
  customer_id: string;
  service_name: string;
  is_active: boolean;
  item_id: string;
}

export interface Items {
  id: string;
  item_name: string;
  customer_service_id: { id: string };
}

export interface DailyReportItem {
  id: string;
  date: string;
  working_day: string;
  customer: string | undefined;
  employees: string[];
  equipment: string[];
  services: string;
  item: string;
  start_time: string;
  end_time: string;
  status: 'pendiente' | 'ejecutado' | 'cancelado' | 'reprogramado';
  description: string;
  document_path?: string;
}

export interface DailyReportData {
  id: string;
  date: string;
  status: boolean;
  dailyreportrows: DailyReportItem[];
}

export interface DailyReportProps {
  reportData?: DailyReportData | undefined;
  allReport?: DailyReportData[];
}

export interface Diagram {
  id: string;
  created_at: string;
  employee_id: string;
  diagram_type: {
    id: string;
    name: string;
    color: string;
    company_id: string;
    created_at: string;
    short_description: string;
    work_active: boolean;
  };
  day: number;
  month: number;
  year: number;
}

export interface RepairsSolicituds {
  id: string;
  created_at: string;
  reparation_type: {
    id: string;
    name: string;
    criticity: string;
    is_active: boolean;
    company_id: string;
    created_at: string;
    description: string;
    type_of_maintenance: string;
  };
  equipment_id: {
    id: string;
    type: {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
    };
    year: string;
    brand: {
      id: number;
      name: string;
      is_active: boolean;
      created_at: string;
    };
    model: {
      id: number;
      name: string;
      brand: number;
      is_active: boolean;
      created_at: string;
    };
    serie: string;
    domain: string;
    engine: string;
    status: string;
    chassis: string;
    picture: string;
    user_id: string;
    condition: string;
    is_active: boolean;
    kilometer: string;
    company_id: string;
    created_at: string;
    allocated_to: string[];
    intern_number: string;
    type_of_vehicle: number;
    termination_date: string | null;
    reason_for_termination: string | null;
  };
  state: string;
  user_description: string;
  mechanic_description: string;
  end_date: string | null;
  user_id: {
    id: string;
    role: string;
    email: string;
    avatar: string | null;
    fullname: string;
    created_at: string;
    credential_id: string;
  };
  mechanic_id: string | null;
  mechanic_images: (string | null)[];
  user_images: string[];
  employee_id: string | null;
  kilometer: string | null;
  repairlogs: {
    id: string;
    title: string;
    kilometer: string | null;
    repair_id: string;
    created_at: string;
    description: string;
    modified_by_user: string | null;
    modified_by_employee: string | null;
  }[];
}
