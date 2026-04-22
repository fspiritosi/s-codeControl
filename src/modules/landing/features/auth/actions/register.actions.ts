'use server';

import { prisma } from '@/shared/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function signup(formData: FormData, url: string) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstname = formData.get('firstname') as string;
  const lastname = formData.get('lastname') as string;

  // Check if user already exists
  const existing = await prisma.profile.findFirst({ where: { email } });
  if (existing) return 'El email ya esta registrado';

  // Create profile with hashed password
  const id = randomUUID();
  const password_hash = await bcrypt.hash(password, 12);

  try {
    await prisma.profile.create({
      data: {
        id,
        credential_id: id,
        email,
        fullname: `${firstname} ${lastname}`,
        role: 'CodeControlClient',
        password_hash,
      },
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return 'Error al crear el usuario. Intente nuevamente.';
  }

  revalidatePath('/', 'layout');
  return null;
}
