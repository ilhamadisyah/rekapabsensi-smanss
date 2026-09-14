import { Employee } from '../types';

/**
 * Pemetaan opsional nama pegawai berdasarkan ID Mesin Biometrik.
 * Kosong secara default agar seluruh data pegawai berasal murni dari database atau berkas presensi yang diunggah.
 */
export const KNOWN_MACHINE_ID_NAMES: Record<string, string> = {};

export function getEmployeeNameByMachineId(machineId: string, fallbackName?: string): string {
  const cleanId = String(machineId || '').trim().replace(/\.0$/, '');

  // 1. Prioritaskan nama nyata yang terbaca dari berkas atau parameter
  if (
    fallbackName &&
    fallbackName.trim() &&
    !fallbackName.toLowerCase().includes('pegawai id') &&
    !fallbackName.toLowerCase().includes('(id:')
  ) {
    return fallbackName.trim();
  }

  // 2. Cek kamus ID mesin jika ada
  if (KNOWN_MACHINE_ID_NAMES[cleanId]) {
    return KNOWN_MACHINE_ID_NAMES[cleanId];
  }

  // 3. Cek daftar master default
  const emp = INITIAL_EMPLOYEES.find((e) => e.machine_id === cleanId);
  if (emp && emp.full_name) {
    return emp.full_name;
  }

  return fallbackName && fallbackName.trim() ? fallbackName.trim() : ('Pegawai ' + cleanId);
}

/**
 * Daftar awal pegawai bawaan sistem.
 * Dikosongkan agar pengguna dapat memasukkan data pegawai sebenarnya.
 */
export const INITIAL_EMPLOYEES: Employee[] = [];

export function getEmployeeByMachineId(machineId: string, employeeList: Employee[] = INITIAL_EMPLOYEES): Employee | undefined {
  const cleanId = String(machineId || '').trim().replace(/\.0$/, '');
  return employeeList.find(e => e.machine_id === cleanId);
}

export function getEmployeeByRowIndex(rowIndex: number, employeeList: Employee[] = INITIAL_EMPLOYEES): Employee | undefined {
  return employeeList.find(e => e.excel_row_index === rowIndex);
}
