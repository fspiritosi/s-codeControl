'use client'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import MotionTransition from '../MotionTransition'
import Image from 'next/image'
import ImageBg from '../../../public/bg-img.jpg'

function FirstBlock() {
  return (
    <div className='relative p-4 md:py-40'>
       <div className='grid max-w-5xl mx-auto md:grid-cols-2'>
        <div>
          <h1 className='text-5xl font-semibold'>
            Gesioná 
            <span className='block text-blue-400'>eficientemente</span>
            todos tus procesos
          </h1>
          <p className='max-w-md mt-10'>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Animi obcaecati praesentium, modi quis blanditiis iste odit fugiat corporis natus doloribus asperiores provident at possimus veritatis, laudantium explicabo repellendus nam dolorem.
          </p>
          <div className='my-8'>
            <Link href='/login' >
              <Button variant={'primary'}>Empieza ahora</Button>
            </Link>
          </div>
        </div>
        <MotionTransition className='flex items-center justify-center'>
          
          <Image src={ImageBg} alt='imagen de fondo' width={450} height={450} className='h-auto w-72 md:w-full rounded-lg'/>
          
        </MotionTransition>
       </div>
    </div>
  )
}

export default FirstBlock