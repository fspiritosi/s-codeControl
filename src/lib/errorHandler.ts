export function handleSupabaseError(error: any): string {
  let errorMessage = error.message
  switch (error.code) {
    case '22001':
      errorMessage = 'El valor ingresado está fuera del rango permitido'
      break
    case '23502':
      errorMessage = 'Por favor, completa todos los campos obligatorios'
      break
    case '23505':
      errorMessage =
        'El valor ingresado ya existe, por favor ingresa uno diferente'
      break
    case '42501':
      errorMessage = 'No tienes permisos para realizar esta operación'
      break
    // Agrega más casos según sea necesario
    default:
      errorMessage = 'Ha ocurrido un error al procesar la solicitud'
  }
  return errorMessage
}
