import { Vehicle } from '@/zodSchemas/schemas';
import { create } from 'zustand';
import {
  fetchVehiclesByCompany,
  fetchEquipmentDocsByVehicleId,
} from '@/app/server/GET/actions';

const setVehiclesToShow = (vehicles: Vehicle) => {
  return vehicles?.map((item: any) => ({
    ...item,
    types_of_vehicles: item.types_of_vehicles?.name || item.type_of_vehicle_rel?.name,
    brand: item.brand_vehicles?.name || item.brand_rel?.name,
    model: item.model_vehicles?.name || item.model_rel?.name,
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

    const data = await fetchVehiclesByCompany(companyId);

    if (data) {
      set({ vehicles: (data || []) as unknown as Vehicle });
      const activesVehicles = (data || []) as unknown as Vehicle;
      set({ vehiclesToShow: setVehiclesToShow(activesVehicles) });
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
      (vehicle: any) => (vehicle?.types_of_vehicles?.name || vehicle?.type_of_vehicle_rel?.name) === type
    );
    set({ vehiclesToShow: setVehiclesToShow(vehiclesToShow) });
  },

  documentDrawerVehicles: async (id: string) => {
    const equipmentData = await fetchEquipmentDocsByVehicleId(id);

    // Map Prisma relation names to expected format
    const mapped = equipmentData?.map((d: any) => ({
      ...d,
      document_types: d.document_type || d.document_types,
      applies: d.vehicle || d.applies,
    }));

    set({ DrawerVehicles: mapped });
  },
}));
