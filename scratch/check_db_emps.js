const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
console.log('Employees in db count:', db.employees.length);
console.log('First 5:', db.employees.slice(0, 5).map(e => ({ name: e.full_name, id: e.machine_id })));
console.log('Last 5:', db.employees.slice(-5).map(e => ({ name: e.full_name, id: e.machine_id })));
