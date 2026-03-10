'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

  revalidatePath('/', 'layout');
  redirect('/login');
}
