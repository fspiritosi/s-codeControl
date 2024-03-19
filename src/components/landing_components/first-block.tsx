'use client'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import MotionTransition from './Animation/MotionTransition'
import Image from 'next/image'
import Logo_blanco from '../../../public/logoLetrasBlancas.png'
import Logo_negro from '../../../public/logoLetrasNegras.png'
import { Reveal } from './Animation/Reveal'
import { useTheme } from 'next-themes'

function FirstBlock() {
  const {theme} = useTheme()
  return (
    <div className="relative p-4 md:py-40">
      <div className="grid max-w-5xl mx-auto md:grid-cols-2">
        <div>
          <Reveal>
            <h1 className="text-5xl font-semibold">
              Gestioná
              <span className="block text-blue-400">eficientemente</span>
              todos tus procesos
            </h1>
          </Reveal>
          <Reveal>
            <p className="max-w-md mt-10">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Animi
              obcaecati praesentium, modi quis blanditiis iste odit fugiat
              corporis natus doloribus asperiores provident at possimus
              veritatis, laudantium explicabo repellendus nam dolorem.
            </p>
          </Reveal>
          <Reveal>
            <div className="my-8">
              <Link href="/login">
                <Button variant={'primary'}>Empieza ahora</Button>
              </Link>
            </div>
          </Reveal>
        </div>
        <MotionTransition className="flex items-center justify-center">
          <Image
            src={theme === 'dark' ? Logo_blanco : Logo_negro} 
            alt="imagen de fondo"
            width={450}
            height={450}
            className="h-auto w-72 md:w-full rounded-lg"
          />
        </MotionTransition>
      </div>
    </div>
  )
}

export default FirstBlock
