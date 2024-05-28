import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

function MandenimientoPage() {
  return (
    <div>
      <h2>Mantenimiento pagina</h2>
      <Link
        href={'/dashboard/maintenance/new'}
        className={buttonVariants({ variant: 'outline' })}
      >
        Nuevo
      </Link>
    </div>
  )
}

export default MandenimientoPage
