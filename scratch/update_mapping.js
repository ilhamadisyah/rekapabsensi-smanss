const fs = require('fs');
const emps = JSON.parse(fs.readFileSync('scratch/generated_employees.json', 'utf8'));

const knownNames = {};
for (const e of emps) {
  knownNames[e.machine_id] = e.full_name;
}

const content = `import { Employee } from '../types';

export const KNOWN_MACHINE_ID_NAMES: Record<string, string> = ${JSON.stringify(knownNames, null, 2)};

export function getEmployeeNameByMachineId(machineId: string, fallbackName?: string): string {
  const cleanId = String(machineId || '').trim().replace(/\\.0$/, '');
  if (KNOWN_MACHINE_ID_NAMES[cleanId]) {
    return KNOWN_MACHINE_ID_NAMES[cleanId];
  }
  if (fallbackName && fallbackName.trim() && !fallbackName.toLowerCase().includes('pegawai id') && !fallbackName.toLowerCase().includes('(id:')) {
    return fallbackName.trim();
  }
  const emp = INITIAL_EMPLOYEES.find((e) => e.machine_id === cleanId);
  if (emp && emp.full_name) {
    return emp.full_name;
  }
  return fallbackName && fallbackName.trim() ? fallbackName.trim() : ('Pegawai ' + cleanId);
}

export const INITIAL_EMPLOYEES: Employee[] = ${JSON.stringify(emps, null, 2)};

export function getEmployeeByMachineId(machineId: string, employeeList: Employee[] = INITIAL_EMPLOYEES): Employee | undefined {
  const cleanId = String(machineId || '').trim().replace(/\\.0$/, '');
  return employeeList.find(e => e.machine_id === cleanId);
}

export function getEmployeeByRowIndex(rowIndex: number, employeeList: Employee[] = INITIAL_EMPLOYEES): Employee | undefined {
  return employeeList.find(e => e.excel_row_index === rowIndex);
}
`;

fs.writeFileSync('src/lib/attendance/employee-mapping.ts', content, 'utf8');
console.log('src/lib/attendance/employee-mapping.ts updated successfully!');
