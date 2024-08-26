import { Metadata } from 'next';

import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { data } from './task';


export default async function RepairSolicitudes() {
  const tasks = data;

  return <DataTable  data={tasks} columns={columns} />;
}
