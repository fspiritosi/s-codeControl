'use client'
import MotionTransition from './Animation/MotionTransition'
import CountUp from 'react-countup'

const dataCounter = [
  {
    id: 1,
    startNumeber: 30,
    endNumber: 300,
    text: 'usuarios activos',
  },
  {
    id: 2,
    startNumber: 0,
    endNumber: 200,
    text: 'empresas activas',
  },
  {
    id: 3,
    startNumber: 10,
    endNumber: 5000,
    text: 'documentos procesados',
  },
]

function CounterData() {
  return (
    <MotionTransition className="max-w-5xl py-10 mx-auto mdpy-64">
      <div className="justify-between md:flex">
        {dataCounter.map(({ id, startNumber, endNumber, text }) => (
          <div key={id} className="py-5 text-2xl text-center md:text-left">
            +
            <CountUp
              start={startNumber}
              end={endNumber}
              duration={1.5}
              enableScrollSpy
            />{' '}
            <span className="text-blue-500">{text}</span>
          </div>
        ))}
      </div>
    </MotionTransition>
  )
}

export default CounterData
