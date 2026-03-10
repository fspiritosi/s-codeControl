export function getVehiclePropertyValue(vehicle: any, accessor_key: string): string {
  const parts = accessor_key.split('.');
  let value = parts.reduce((acc, key) => (acc ? acc[key] : undefined), vehicle);
  let result = '';

  if (accessor_key === 'contractor_equipment' && Array.isArray(vehicle.contractor_equipment)) {
    const names = vehicle.contractor_equipment.map((r: any) => r.contractor_id?.name).filter(Boolean);
    return names.join(',');
  }

  if (value && typeof value === 'object' && 'name' in value) {
    result = String(value.name).trim();
  } else {
    result = value != null ? String(value).trim() : '';
  }
  return result;
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getEmployeePropertyValue(employee: any, accessor_key: string): string {
  let value = employee[accessor_key as keyof typeof employee];
  let result = '';

  if (accessor_key === 'contractor_employee' && Array.isArray(value)) {
    const clientNames = value
      .filter((item) => item && item.customers && item.customers.name)
      .map((item) => item.customers.name);
    result = clientNames.length > 0 ? clientNames.join(',') : '';
  } else if (value && typeof value === 'object' && 'name' in value) {
    result = value.name ? String(value.name).trim() : '';
  } else if (typeof value === 'boolean') {
    result = value ? 'Sí' : 'No';
  } else if (value === null && ['guild', 'covenant', 'category', 'company_position'].includes(accessor_key)) {
    result = 'No asignado';
  } else {
    result = value !== undefined && value !== null ? String(value).trim() : '';
  }

  return result;
}

export function formatName(name: string): string {
  return name.charAt(0)?.toUpperCase() + name.slice(1).toLowerCase();
}

export function formatDescription(description: string | undefined): string | undefined {
  if (description) {
    return description.charAt(0)?.toUpperCase() + description.slice(1).toLowerCase();
  }
  return description;
}
