// Employees module — Phase 5

// List actions
export {
  fetchAllEmployees,
  fetchAllActivesEmployees,
  fetchAllEmployeesWithRelations,
  fetchAllEmployeesWithRelationsById,
  findEmployeeByFullName,
  fetchEmployeesWithDocs,
  fetchEmployeesByCompanyAndStatus,
  fetchEmployeesForInitStore,
  fetchAllCustomers,
  filterEmployeesByConditions,
  filterVehiclesByConditions,
} from './features/list/actions.server';

// Detail actions
export { fetchSingEmployee } from './features/detail/actions.server';

// Create / mutate actions
export {
  createEmployee,
  updateEmployeeByDocNumber,
  updateEmployeeByDocNumberFull,
  deactivateEmployee,
  reactivateEmployeeByDocNumber,
  deleteContractorEmployee,
  insertContractorEmployee,
  resetDocumentEmployeesForReintegration,
  updateEmployeeAllocatedTo,
  deactivateEmployeeByDocNumber,
} from './features/create/actions.server';

// Diagrams actions
export {
  fetchDiagrams,
  fetchDiagramsByEmployeeId,
  fetchDiagramsTypes,
  getDiagramEmployee,
  fetchDiagramsHistoryByEmployeeId,
  UpdateDiagramsById,
  CreateDiagrams,
} from './features/diagrams/actions.server';

// Validation actions
export {
  validateEmployeeFileExists,
  validateEmployeeFileExistsForUpdate,
  validateDuplicatedCompanyCuitServer,
  validateDuplicatedCuilServer,
  validateDuplicatedCuilForUpdateServer,
} from './features/validation/actions.server';

// Shared utils
export {
  setEmployeeDataOptions,
  fetchWorkDiagrams,
  fetchGuilds,
  fetchCovenants,
  fetchHierrarchicalPositions,
} from './shared/utils';

// Shared types
export type { Province, dataType, diagram, EmployeeComponentProps } from './shared/types';
