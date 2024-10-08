import type { Database as DB } from '../../../database.types';

// EXPORTAR TIPOS GLOBALES
declare global {
  type Database = DB;
  type Vehicles = DB['public']['Tables']['vehicles']['Row']; //! TABLA CON LA RELACION DE LA MARCA
  type Brand = DB['public']['Tables']['brand_vehicles']['Row']; //! TABLA DE MARCAS
  type TypeOfDocuments = DB['public']['Tables']['document_types']['Row'];
  type Company = DB['public']['Tables']['company']['Row'];
  type DocumentEmployees = DB['public']['Tables']['documents_employees']['Row'];
  type Employees = DB['public']['Tables']['employees']['Row'];
}

// EXPORTAR TIPOS CON RELACIONES
export interface VehiclesWithBrand extends Omit<Vehicles, 'brand'> {
  //! TABLA DE MARCAS
  brand: Brand;
}
