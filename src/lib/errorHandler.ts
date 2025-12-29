import { supabaseBrowser } from './supabase/browser';

export function handleSupabaseError(error: string): string {
  const errorMessages: { [code: string]: string } = {
    '22001': 'El valor ingresado está fuera del rango permitido',
    '23502': 'Por favor, completa todos los campos obligatorios',
    '23505': 'El valor ingresado ya existe, por favor ingresa uno diferente',
    '42501': 'No tienes permisos para realizar esta operación',
    'Invalid login credentials': 'Correo o contraseña inválidos',
    'User already registered': 'El usuario ya se encuentra registrado',
    'duplicate key value violates unique constraint "unique_contractor_employee"': 'Afectacion duplicada',
    'duplicate key value violates unique constraint "unique_cuil_per_company"': 'Ya existe un empleado con este CUIL en la empresa',
    'duplicate key value violates unique constraint "unique_document_number_per_company"': 'Ya existe un empleado con este número de documento en la empresa',
    'The resource already exists': 'El recurso ya existe',
    'El recurso ya existe': 'El recurso ya existe',
  };

  if (!errorMessages[error]) {
    //Aqui podemos guardar este error en alguna tabla para poder manejarlo mas adelante
    const supabase = supabaseBrowser();

    const saveErrorMenssage = async () => {
      await supabase.from('handle_errors').insert({
        menssage: error,
        path: window.location.pathname,
      });
    };

    saveErrorMenssage();
  }

  const errorMessage = errorMessages[error] || 'Ha ocurrido un error al procesar la solicitud';
  return errorMessage;
}
