import React from 'react'
import { Reveal } from './Animation/Reveal'
import { Button } from '../ui/button'
import Link from 'next/link'
import { BestBussinesData } from '@/types/types'
import { MdAttachMoney, MdAccountBalance, MdOutlineSend } from 'react-icons/md'

const dataFeaturesBussiness: BestBussinesData = [
  {
    id: 1,
    icon: <MdAttachMoney />,
    title: 'Recompensas',
    description:
      'Las mejores tarjetas de crédito ofrecen algunas combinaciones tentadoras de promociones y premios.',
  },
  {
    id: 2,
    icon: <MdAccountBalance />,
    title: '100% Seguro',
    description:
      'Tomamos medidas proactivas para asegurarnos de que su información  y sus transacciones estén seguras.',
  },
  {
    id: 3,
    icon: <MdOutlineSend />,
    title: 'Envíos gratis',
    description:
      'Una tarjeta de crédito con transferencia de saldo puede ahorrarle mucho dinero en intereses.',
  },
]

function BestBusines() {
  return (
    <div className="relative px-6 py-20 md:py-64">
      {/* aca puede ir un background */}
      <div className="grid max-w-5xl mx-auto md:grid-cols-2">
        <div>
          <Reveal>
            <h2 className="text-5xl font-semibold">
              <span className="block text-blue-300">Carga tus recursos</span>
              <br />
              Te ayudamos a mantenerlos vigentes
            </h2>
          </Reveal>
          <Reveal>
            <p className="max-w-md mt-10">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum
              impedit quos eligendi. Aliquid ipsam quae, at ullam laboriosam est
              molestias possimus assumenda saepe accusantium praesentium
              reiciendis omnis eius! Dolore, officia.
            </p>
          </Reveal>
          <Reveal>
            <div className="my-8">
              <Link href="#servicios">
                <Button variant="secondary" className="text-white font-bold">
                  Elige tu plan
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="grid items-center py-5 md:p-8">
          {dataFeaturesBussiness.map(({ id, icon, title, description }) => (
            <Reveal key={id}>
              <div className="grid grid-flow-col gap-5 px-4 py-2 rounded-3xl group hover:bg-blue-200">
                <div className="text-center">
                  <div className="flex justify-center">
                    <div className="w-[40px] h-[40px]">{icon}</div>
                    <h4 className="text-primary">{title}</h4>
                  </div>
                  <p className="text-gray-500">{description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BestBusines
