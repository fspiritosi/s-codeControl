export function handleSupabaseError(error: any): string {
    console.log(error,'Este es el error nativo ');
    let errorMessage = error.message;
    console.log(errorMessage,'este es el error no nattivo');
    switch (error.code) {
        case '22001':
            errorMessage = 'Error: el valor de la consulta está fuera del rango';
            break;
        case '23502':
            errorMessage = 'Error: un valor nulo viola la restricción NOT NULL';
            break;
        case '23505':
            errorMessage = 'Error: un valor duplicado viola la restricción de unicidad';
            break;
        // Agrega más casos según sea necesario
        default:
            errorMessage = 'Ha ocurrido un error al realizar la petición a Supabase';
    }
    console.log(errorMessage,'este es el error final');
    return errorMessage;
}
