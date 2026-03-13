// Equipment module — Phase 7

// List actions
export {
  fetchAllEquipment,
  fetchAllEquipmentWithRelations,
  fetchEquipmentById,
  fetchVehiclesByCompany,
} from './features/list/actions.server';

// Create / mutate actions
export {
  UpdateVehicle,
  insertVehicle,
  updateVehicleById,
  updateVehicleByIdAndCompany,
  checkVehicleDomainExists,
  deleteContractorEquipment,
  insertContractorEquipment,
  insertBrandVehicle,
  insertModelVehicle,
  insertTypeVehicle,
  fetchVehicleModelsByBrand,
  reactivateVehicle,
  deactivateVehicle,
  updateVehicleAllocatedTo,
} from './features/create/actions.server';

// Shared utils
export {
  setVehicleDataOptions,
  fetchVehicleBrands,
  fetchVehicleModels,
  fetchTypeVehicles,
  fetchTypesOfVehicles,
} from './shared/utils';

// Shared types
export type { VehicleType, generic, dataType, VehiclesFormProps } from './shared/types';
