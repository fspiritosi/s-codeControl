'use client'
import { CardsGrid } from '../../../components/CardsGrid'
import { useLoggedUserStore } from '@/store/loggedUser'

export default function allCompany() {
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  if (!allCompanies) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Cargando...</div>
      </div>
    )
  }
  return (
    <main className="bg-slate-400">
      <h2 className=" text-3xl pb-5 pl-10">Todas las Compañias</h2>
      <p className="pl-10 max-w-1/2">Aqui se veran todas las compañias</p>
      <div className="bg-white rounded-lg shadow-md p-4">
        <CardsGrid companies={allCompanies} />
      </div>
    </main>
  )
}
