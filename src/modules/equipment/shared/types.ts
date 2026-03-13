import { ReactNode } from 'react';

export type VehicleType = {
  year: string;
  engine: string;
  chassis: string;
  serie: string;
  domain: string;
  intern_number: string;
  picture: string;
  type_of_vehicle: string;
  types_of_vehicles: { name: string };
  brand_vehicles: { name: string };
  brand: string;
  model_vehicles: { name: string };
  model: string;
  type: { name: string };
  id: string;
  allocated_to: string[];
  condition: 'operativo' | 'no operativo' | 'en reparación' | 'operativo condicionado';
};

export type generic = {
  name: string;
  id: string;
};

export type dataType = {
  tipe_of_vehicles: generic[];
  models: {
    name: string;
    id: string;
  }[];
};

export interface VehiclesFormProps {
  vehicle: any | null;
  children: ReactNode;
  types: generic[];
  brand_vehicles: VehicleBrand[] | null;
  role?: string;
}
