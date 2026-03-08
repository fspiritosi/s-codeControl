import { Vehicle } from '@/zodSchemas/schemas';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';

const setVehiclesToShow = (vehicles: Vehicle) => {
  return vehicles?.map((item) => ({
    ...item,
    types_of_vehicles: item.types_of_vehicles.name,
    brand: item.brand_vehicles.name,
    model: item.model_vehicles.name,
  }));
};

interface VehicleState {
  vehicles: Vehicle;
  vehiclesToShow: any;
  DrawerVehicles: any[] | null;
  fetchVehicles: () => void;
  setActivesVehicles: () => void;
  endorsedVehicles: () => void;
  noEndorsedVehicles: () => void;
  setVehicleTypes: (type: string) => void;
  documentDrawerVehicles: (id: string) => void;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [] as unknown as Vehicle,
  vehiclesToShow: undefined,
  DrawerVehicles: null,

  fetchVehicles: async () => {
    const { useCompanyStore } = require('./companyStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;
    if (!companyId) return;

    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `*,
        types_of_vehicles(name),
        brand_vehicles(name),
        model_vehicles(name)`
      )
      .eq('company_id', companyId);

    if (error) {
      console.error('Error al obtener los vehículos:', error);
    } else {
      set({ vehicles: data || [] });
      const activesVehicles = data || [];
      set({ vehiclesToShow: setVehiclesToShow(activesVehicles as Vehicle) });
    }
  },

  setActivesVehicles: () => {
    set({ vehiclesToShow: setVehiclesToShow(get().vehicles) });
  },

  endorsedVehicles: () => {
    const endorsed = get().vehicles.filter((vehicle) => vehicle.status === 'Completo');
    set({ vehiclesToShow: setVehiclesToShow(endorsed) });
  },

  noEndorsedVehicles: () => {
    const noEndorsed = get().vehicles.filter((vehicle) => vehicle.status !== 'Completo');
    set({ vehiclesToShow: setVehiclesToShow(noEndorsed) });
  },

  setVehicleTypes: (type: string) => {
    if (type === 'Todos') {
      set({ vehiclesToShow: setVehiclesToShow(get().vehicles) });
      return;
    }
    const vehiclesToShow = get().vehicles?.filter(
      (vehicle) => vehicle?.types_of_vehicles?.name === type
    );
    set({ vehiclesToShow: setVehiclesToShow(vehiclesToShow) });
  },

  documentDrawerVehicles: async (id: string) => {
    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `*,
        document_types:document_types(*),
        applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`
      )
      .eq('applies.id', id)
      .not('applies', 'is', null);

    set({ DrawerVehicles: equipmentData });
  },
}));
