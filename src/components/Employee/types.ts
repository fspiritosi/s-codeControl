export type Province = {
  id: number;
  name: string;
};

export type dataType = {
  guild: {
    name: string;
    id: string;
    is_active: boolean;
  }[];
  covenants: {
    name: string;
    number: string;
    guild_id: string;
    id: string;
    is_active: boolean;
  }[];
  category: {
    name: string;
    id: string;
    covenant_id: string;
    is_active: boolean;
  }[];
};

export type diagram = {
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
  };
  day: number;
  month: number;
  year: number;
};

export interface EmployeeComponentProps {
  historyData: any;
  role: string | null;
  user: any;
  activeEmploees: any;
  diagrams: EmployeeDiagramWithDiagramType[];
  diagrams_types: any;
  guild:
    | {
        value: string;
        label: string;
      }[]
    | undefined;
  covenants:
    | {
        id: string;
        name: string;
        guild_id: string;
      }[]
    | undefined;
  categories:
    | {
        id: string;
        name: string;
        covenant_id: string;
      }[]
    | undefined;
  children: React.ReactNode;
}
