'use client';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
export default function ThanksPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-2">
      <Card className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
          </div>
          <CardDescription className="text-center text-gray-600">
            Sistema de Checklist y Mantenimiento de Equipos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por usar codeControl!</h2>
            <p className="text-gray-600 mb-4">Su acción ha sido registrada exitosamente en nuestro sistema.</p>
          </motion.div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href={'/'} className={buttonVariants({ variant: 'default' })}>
              Volver al inicio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
    </div>
  );
}
