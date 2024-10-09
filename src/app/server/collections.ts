import type { Database as DB } from '../../../database.types';

// EXPORTAR TIPOS GLOBALES
declare global {
  type Database = DB;
  type Vehicles = DB['public']['Tables']['vehicles']['Row'];
  type Brand = DB['public']['Tables']['brand_vehicles']['Row'];
  type TypeOfDocuments = DB['public']['Tables']['document_types']['Row'];
  type Company = DB['public']['Tables']['company']['Row'];
  type DocumentEmployees = DB['public']['Tables']['documents_employees']['Row'];
  type Employees = DB['public']['Tables']['employees']['Row'];
  type DocumentEquipment = DB['public']['Tables']['documents_equipment']['Row'];
  type ContractorEmployee = DB['public']['Tables']['contractor_employee']['Row'];
  type Customers = DB['public']['Tables']['customers']['Row'];
  type Model = DB['public']['Tables']['model_vehicles']['Row'];
  type Type = DB['public']['Tables']['type']['Row'];
  type type_of_vehicle = DB['public']['Tables']['types_of_vehicles']['Row'];
  type DocumentsCompany = DB['public']['Tables']['documents_company']['Row'];
  type Profile = DB['public']['Tables']['profile']['Row'];
  type RepairsSolicituds = DB['public']['Tables']['repair_solicitudes']['Row'];
  type TypeOfRepair = DB['public']['Tables']['types_of_repairs']['Row'];
  type RepairLogs = DB['public']['Tables']['repairlogs']['Row'];
  type EnumOfRepairStatus = DB['public']['Enums']['repair_state'];
  type EnumVehicleCondition = DB['public']['Enums']['condition_enum'];
  type DiagramEmployee = DB['public']['Tables']['employees_diagram']['Row'];
  type DiagramType = DB['public']['Tables']['diagram_type']['Row'];
  type City = DB['public']['Tables']['cities']['Row'];
  type Province = DB['public']['Tables']['provinces']['Row'];
  type WorkflowDiagram = DB['public']['Tables']['work-diagram']['Row'];
  type HierarchicalPosition = DB['public']['Tables']['hierarchy']['Row'];
  type ServiceItems = DB['public']['Tables']['service_items']['Row'];
  type ItemMensureUnits = DB['public']['Tables']['measure_units']['Row'];
  type Customer = DB['public']['Tables']['customers']['Row'];
  type CustomerService = DB['public']['Tables']['customer_services']['Row'];
  type DiagramTypes = DB['public']['Tables']['diagram_type']['Row'];

  //! EXPORTAR TIPOS CON RELACIONES

  interface CustomerServiceWithRelations extends Omit<CustomerService, 'customer_id' | 'service_id'> {
    customer_id: Customers;
  }
  interface ServiceItemsWithRelations
    extends Omit<ServiceItems, 'measure_unit' | 'customer_service_id' | 'item_measure_units'> {
    measure_unit: ItemMensureUnits;
    item_measure_units: ItemMensureUnits;
    customer_service_id: {
      customer_id: Customers;
    };
  }
  interface CompanyWithRelations extends Omit<Company, 'province_id'> {
    province_id: Province;
  }
  interface CompanyWithCity extends Omit<Company, 'city'> {
    city: City;
  }
  interface EmployeesDiagramWithRelations extends Omit<DiagramEmployee, 'employee_id' | 'diagram_type'> {
    employee_id: Employees;
    diagram_type: DiagramType;
  }

  interface EmployeeWithRelations
    extends Omit<
      Employees,
      'city' | 'province' | 'workflow_diagram' | 'hierarchical_position' | 'birthplace' | 'contractor_employee'
    > {
    city: City;
    province: Province;
    workflow_diagram: WorkflowDiagram;
    hierarchical_position: HierarchicalPosition;
    birthplace: City;
    contractor_employee: ContractorWithCustomers[];
  }
  interface EmployeeWithRelationsWithCompany extends Omit<EmployeeWithRelations, 'company_id'> {
    company_id: CompanyWithRelations;
  }
  interface DocumentEmployeeWithRelations extends Omit<DocumentEmployees, 'id_document_types' | 'applies'> {
    id_document_types: TypeOfDocuments;
    applies: EmployeeWithRelationsWithCompany;
  }

  interface DiagramEmployeeWithDiagramType extends Omit<DiagramEmployee, 'diagram_type'> {
    diagram_type: DiagramType;
  }
  interface RepairLogsWithRelations extends Omit<RepairLogs, 'modified_by_employee' | 'modified_by_user'> {
    modified_by_employee: Employees;
    modified_by_user: Profile;
  }
  interface RepairSoliciudesWithOnlyVechicleRelations extends Omit<RepairsSolicituds, 'equipment_id'> {
    equipment_id: Vehicles;
  }
  interface RepairSolicitudesWithRelations
    extends Omit<RepairsSolicituds, 'user_id' | 'employee_id' | 'equipment_id' | 'reparation_type' | 'repairlogs'> {
    user_id: Profile;
    employee_id: Employees;
    equipment_id: VehiclestWithRelations;
    reparation_type: TypeOfRepair;
    repairlogs: RepairLogsWithRelations[];
  }
  interface CompanyDocumentTypesWithRelations extends Omit<DocumentsCompany, 'id_document_types' | 'user_id'> {
    id_document_types: TypeOfDocuments;
    user_id: Profile;
  }
  interface CompanyDocumentsWithDocumentTypes extends Omit<DocumentsCompany, 'id_document_types' | 'applies'> {
    id_document_types: TypeOfDocuments;
    applies: {
      company_id: CompanyWithRelations;
    };
  }
  interface VehiclesWithBrand extends Omit<Vehicles, 'brand'> {
    brand: Brand;
  }
  interface ContractorWithCustomers extends Omit<ContractorEmployee, 'customers'> {
    customers: Customers;
  }
  interface VehiclestWithRelations extends Omit<Vehicles, 'type' | 'brand' | 'model' | 'type_of_vehicle'> {
    type: Type;
    brand: Brand;
    model: Model;
    type_of_vehicle: type_of_vehicle;
  }
  interface VehiclestWithRelationsWithCompany extends Omit<VehiclestWithRelations, 'company_id' | 'type'> {
    company_id: CompanyWithRelations;
  }
  interface EmployeesWithContractors extends Omit<Employees, 'contractor_employee'> {
    contractor_employee: ContractorWithCustomers[];
  }
  interface DocumentEmployeesWithRelations extends Omit<DocumentEmployees, 'id_document_types' | 'applies'> {
    id_document_types: TypeOfDocuments;
    applies: EmployeesWithContractors;
  }
  interface DocumentEquipmentWithRelations extends Omit<DocumentEmployees, 'id_document_types' | 'applies'> {
    id_document_types: TypeOfDocuments;
    applies: VehiclestWithRelations;
  }
  interface DocumentEquipmentWithRelationsIncludesCompany
    extends Omit<DocumentEmployees, 'id_document_types' | 'applies'> {
    id_document_types: TypeOfDocuments;
    applies: VehiclestWithRelationsWithCompany;
  }
}
