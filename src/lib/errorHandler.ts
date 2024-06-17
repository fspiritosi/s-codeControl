export function handleSupabaseError(error: string): string {
  console.log(error)
  const errorMessages: { [code: string]: string } = {
    '22001': 'El valor ingresado está fuera del rango permitido',
    '23502': 'Por favor, completa todos los campos obligatorios',
    '23505': 'El valor ingresado ya existe, por favor ingresa uno diferente',
    '42501': 'No tienes permisos para realizar esta operación',
    'Invalid login credentials': 'Correo o contraseña inválidos',
    'duplicate key value violates unique constraint "document_types_name_key"':
      'Ya existe un tipo de documento con ese nombre',
  }

  if (!errorMessages[error]) {
    //Aqui podemos guardar este error en alguna tabla para poder manejarlo mas adelante
  }

  const errorMessage =
    errorMessages[error] || 'Ha ocurrido un error al procesar la solicitud'
  return errorMessage
}
