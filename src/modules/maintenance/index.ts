// Maintenance module — Phase 8

// Repairs actions
export {
  fetchAllOpenRepairRequests,
  fetchRepairRequestsByEquipmentId,
  fetchOpenRepairsByEquipmentIdsAndType,
  fetchOpenRepairsByEquipmentAndType,
  fetchRepairSolicitudesByEquipment,
  updateRepairSolicitude,
} from './features/repairs/actions.server';

// Repairs components
export { default as RepairTypes } from './features/repairs/components/RepairTypes';
export { RepairTypeForm } from './features/repairs/components/RepairTypeForm';
export { default as RepairEntry } from './features/repairs/components/RepairEntry';
export { default as RepairEntryMultiple } from './features/repairs/components/RepairEntryMultiple';
export { default as RepairSolicitudes } from './features/repairs/components/RepairSolicitudesTable/RepairSolicitudes';

// Services components
export { default as ServiceComponent } from './features/services/components/ServiceComponent';
export { default as ServiceTable } from './features/services/components/ServiceTable';
export { default as ServiceItemsTable } from './features/services/components/ServiceItemsTable';
export { default as ServicesForm } from './features/services/components/ServicesForm';
export { default as ServiceItemsForm } from './features/services/components/ServiceItemsForm';
