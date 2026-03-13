import { checkListColumns } from './tables/checkListColumns';
import { TypesOfCheckListTable } from './tables/data-table';

export default async function ChecklistTable({ checklists }: { checklists: CheckListWithAnswer[] }) {


  return (
    <TypesOfCheckListTable
      columns={checkListColumns}
      data={checklists.map((e) => {
        return {
          title: (e.form as { title: string })?.title,
          id: e.id,
          description: (e.form as { description: string })?.description,
          frequency: (e.form as { frequency: string })?.frequency,
          created_at: e.created_at,
          total_responses: e.form_answers?.length,
        };
      })}
    />
  );
}

// [
//   {
//     id: '91337773-60c4-45f3-b5a2-8490f91b3477',
//     created_at: '2024-10-25T13:57:04.710722+00:00',
//     company_id: '20478169-7cdb-4f2d-9df2-9f5b2777de62',
//     form: {
//       id: '1',
//       title: 'Transporte SP-ANAY - CHK - HYS - 01',
//       frequency: 'Semanal',
//       description: 'Check List Inspeccion Vehicular',
//       vehicle_type: [Array],
//     },
//     name: 'Transporte SP-ANAY - CHK - HYS - 01',
//     form_answers: [[Object], [Object], [Object], [Object], [Object]],
//   },
//   {
//     id: 'eb34d676-79a5-4006-8098-20cd6cb1a87e',
//     created_at: '2024-10-25T13:56:48.953292+00:00',
//     company_id: '20478169-7cdb-4f2d-9df2-9f5b2777de62',
//     form: {
//       id: '3',
//       title: 'Transporte SP-ANAY - CHK - HYS - 03',
//       frequency: 'Semanal',
//       description: 'Check List Mantenimiento',
//       vehicle_type: [Array],
//     },
//     name: 'Transporte SP-ANAY - CHK - HYS - 03',
//     form_answers: [],
//   },
//   {
//     id: '24a5d698-b14a-479b-a630-db3e889427f7',
//     created_at: '2024-10-25T13:56:28.573649+00:00',
//     company_id: '20478169-7cdb-4f2d-9df2-9f5b2777de62',
//     form: {
//       id: '2',
//       title: 'Transporte SP-ANAY - CHK - HYS - 04',
//       frequency: 'Diario',
//       description: 'Check List Inspeccion Diaria',
//       vehicle_type: [Array],
//     },
//     name: 'Transporte SP-ANAY - CHK - HYS - 04',
//     form_answers: [
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//       [Object],
//     ],
//   },
// ];

// {
//   id: 'f4ba31c7-7c54-4126-8ff5-f12f3dfbf652',
//   answer: {
//     hora: '17:18',
//     fecha: '2024-12-23',
//     luces: {
//       Balizas: '6',
//       'Luces Altas': '6',
//       'Luces Bajas': '6',
//       'Luces Freno': '6',
//       'Luces de Giro': '6',
//       'Luces de Retroceso': '6',
//       'Luces de Estacionamiento': '6',
//       'Asientos (Estado en general)': '6'
//     },
//     movil: '19a6d5a2-6642-44e7-8d65-3ec6bfa99fe8',
//     chofer: 'EDUARDO LUIS AGUILERA',
//     dominio: 'AE226KJ',
//     interior: {
//       Bocina: '6',
//       Luneta: '6',
//       Parasol: '6',
//       'Apoya cabezas': '6',
//       'Espejo retrovisor': '6',
//       'Espejos laterales': '2',
//       'Aire Acondicionado': '6',
//       'Alarma de Retroceso': '6',
//       'Ventanilla (Cierre)': '6',
//       'Ventanilla (apertura)': '6',
//       'Cinturones de seguridad': '6',
//       'Calefactor Desempañador': '6',
//       'Puertas (cierre efectivo)': '6',
//       'Cortinas/ Sogas / Soportes': '6',
//       'Limpia Parabrisas y Lava Parabrisas': '6',
//       'Funciones de tablero (luces testigo)': '6',
//       'Funcionamiento Tacógrafo (Microtrack)': '6'
//     },
//     mecanica: {
//       'Bateria/Estado': '6',
//       'Elementos sueltos': '6',
//       'Esparragos y Torque': '6',
//       'Neumaticos Traseros': '6',
//       'Neumatico de auxilio': '3',
//       'Nivel de combustible': '6',
//       'Neumaticos Delanteros': '6',
//       'Sistema de Freno (ABS)': '6',
//       'Bandas laterales reflectivas': '6',
//       'Nivel de fluidos y pérdidas': '6',
//       'Suspensión (Amortiguadores)': '6',
//       'Limpieza de Cabina y Exterior': '6',
//       'Criquet (Gato) y llave de rueda': '6',
//       'Cartelería de velocidad máxima': '6',
//       'Bolsas para depósito de residuos': '6',
//       'Filtro de Aire: Motor/Habitaculo Sopletear': '6'
//     },
//     seguridad: {
//       Matafuego: '6',
//       'Apoya cabezas': '6',
//       Arrestallamas: '6',
//       'Airbags frontales': '6',
//       'Chalecos reflectantes': '6',
//       'BOTIQUIN PRIMEROS AUXILIOS': '6',
//       'Balizas triangulares / conos': '6',
//       'Revisión check Point/check Nut': '6'
//     },
//     kilometraje: '306461',
//     observaciones: 'Espejo secundario retrovisor lateral roto.porton central hace mucho ruido'
//   },
//   form_id: '91337773-60c4-45f3-b5a2-8490f91b3477',
//   created_at: '2024-12-23T20:26:16.390336+00:00'
// }
//  ✓ Compiled in 1537ms (4854 modules)
// {
//   id: 'f4ba31c7-7c54-4126-8ff5-f12f3dfbf652',
//   answer: {
//     hora: '17:18',
//     fecha: '2024-12-23',
//     luces: {
//       Balizas: '6',
//       'Luces Altas': '6',
//       'Luces Bajas': '6',
//       'Luces Freno': '6',
//       'Luces de Giro': '6',
//       'Luces de Retroceso': '6',
//       'Luces de Estacionamiento': '6',
//       'Asientos (Estado en general)': '6'
//     },
//     movil: '19a6d5a2-6642-44e7-8d65-3ec6bfa99fe8',
//     chofer: 'EDUARDO LUIS AGUILERA',
//     dominio: 'AE226KJ',
//     interior: {
//       Bocina: '6',
//       Luneta: '6',
//       Parasol: '6',
//       'Apoya cabezas': '6',
//       'Espejo retrovisor': '6',
//       'Espejos laterales': '2',
//       'Aire Acondicionado': '6',
//       'Alarma de Retroceso': '6',
//       'Ventanilla (Cierre)': '6',
//       'Ventanilla (apertura)': '6',
//       'Cinturones de seguridad': '6',
//       'Calefactor Desempañador': '6',
//       'Puertas (cierre efectivo)': '6',
//       'Cortinas/ Sogas / Soportes': '6',
//       'Limpia Parabrisas y Lava Parabrisas': '6',
//       'Funciones de tablero (luces testigo)': '6',
//       'Funcionamiento Tacógrafo (Microtrack)': '6'
//     },
//     mecanica: {
//       'Bateria/Estado': '6',
//       'Elementos sueltos': '6',
//       'Esparragos y Torque': '6',
//       'Neumaticos Traseros': '6',
//       'Neumatico de auxilio': '3',
//       'Nivel de combustible': '6',
//       'Neumaticos Delanteros': '6',
//       'Sistema de Freno (ABS)': '6',
//       'Bandas laterales reflectivas': '6',
//       'Nivel de fluidos y pérdidas': '6',
//       'Suspensión (Amortiguadores)': '6',
//       'Limpieza de Cabina y Exterior': '6',
//       'Criquet (Gato) y llave de rueda': '6',
//       'Cartelería de velocidad máxima': '6',
//       'Bolsas para depósito de residuos': '6',
//       'Filtro de Aire: Motor/Habitaculo Sopletear': '6'
//     },
//     seguridad: {
//       Matafuego: '6',
//       'Apoya cabezas': '6',
//       Arrestallamas: '6',
//       'Airbags frontales': '6',
//       'Chalecos reflectantes': '6',
//       'BOTIQUIN PRIMEROS AUXILIOS': '6',
//       'Balizas triangulares / conos': '6',
//       'Revisión check Point/check Nut': '6'
//     },
//     kilometraje: '306461',
//     observaciones: 'Espejo secundario retrovisor lateral roto.porton central hace mucho ruido'
//   },
//   form_id: '91337773-60c4-45f3-b5a2-8490f91b3477',
//   created_at: '2024-12-23T20:26:16.390336+00:00'
// }
// undefined
// {
//   id: 'c197007c-9e4b-4122-b3c5-7b0ef5cabe44',
//   answer: {
//     fecha: '2024-12-21',
//     luces: 'SI',
//     marca: 'Mercedes Benz',
//     movil: 'f9400be5-3acc-4248-a44f-97a910264490',
//     chofer: 'JUAN CARLOS BENITEZ',
//     frenos: 'SI',
//     modelo: 'Sprinter 414 9+1',
//     seguro: 'SI',
//     dominio: 'AG723NW',
//     fluidos: 'SI',
//     interno: '37',
//     puertas: 'SI',
//     botiquin: 'SI',
//     extintor: 'SI',
//     licencia: 'SI',
//     servicio: 'San Antonio ',
//     neumaticos: 'SI',
//     kilometraje: '9358',
//     ruedaAuxilio: 'SI',
//     arrestallamas: 'NO',
//     estadoGeneral: 'SI',
//     aptoParaOperar: 'SI',
//     alarmaRetroceso: 'SI',
//     kitHerramientas: 'SI',
//     manejoDefensivo: 'SI',
//     parabrisasEspejos: 'SI',
//     verificacionTecnica: 'SI'
//   },
//   form_id: '24a5d698-b14a-479b-a630-db3e889427f7',
//   created_at: '2024-12-21T07:49:05.158601+00:00'
// }
