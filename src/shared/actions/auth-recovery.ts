'use server';

import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { prisma } from '@/shared/lib/prisma';
import { sendEmail } from '@/shared/actions/email';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora
const RESET_COOLDOWN_MS = 60 * 1000; // evita spamear mails al mismo usuario
const MIN_PASSWORD_LENGTH = 6;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Pide un link de recuperación de contraseña. Responde siempre igual, exista o no
 * el email, para no revelar qué cuentas están registradas.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: true };

  const profile = await prisma.profile.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    select: { id: true, email: true, fullname: true },
  });
  if (!profile?.email) return { ok: true };

  const recent = await prisma.auth_tokens.findFirst({
    where: {
      profile_id: profile.id,
      type: 'password_reset',
      created_at: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) },
    },
    select: { id: true },
  });
  if (recent) return { ok: true };

  const token = randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.auth_tokens.deleteMany({ where: { profile_id: profile.id, type: 'password_reset' } }),
    prisma.auth_tokens.create({
      data: {
        profile_id: profile.id,
        type: 'password_reset',
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + RESET_TTL_MS),
      },
    }),
  ]);

  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/reset_password/update-user?token=${token}`;
  await sendEmail({
    to: profile.email,
    subject: 'Recuperá tu contraseña de CodeControl',
    html: `<p>Hola ${profile.fullname ?? ''},</p>
<p>Recibimos un pedido para cambiar tu contraseña. Entrá al siguiente link (vale 1 hora):</p>
<p><a href="${link}">Cambiar mi contraseña</a></p>
<p>Si no fuiste vos, ignorá este mensaje.</p>`,
  });
  return { ok: true };
}

/** Define la nueva contraseña a partir del token del mail. */
export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'El link no es válido' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }

  const record = await prisma.auth_tokens.findUnique({ where: { token_hash: hashToken(token) } });
  if (!record || record.type !== 'password_reset' || record.used_at || record.expires_at < new Date()) {
    return { ok: false, error: 'El link venció o ya fue usado. Pedí uno nuevo.' };
  }

  const password_hash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: record.profile_id },
      data: { password_hash, email_verified_at: new Date() },
    }),
    prisma.auth_tokens.updateMany({
      where: { profile_id: record.profile_id, type: 'password_reset' },
      data: { used_at: new Date() },
    }),
  ]);
  return { ok: true };
}

/**
 * Alta de un usuario con contraseña definida por quien invita (reemplaza a
 * `auth.admin.createUser` de Supabase, que se llamaba desde el navegador).
 */
export async function registerUserWithPassword(input: {
  email: string;
  password: string;
  fullname: string;
  role?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const session = await auth();
  if (!session?.user?.profileId) return { id: null, error: 'No autorizado' };

  const email = input.email.trim().toLowerCase();
  if (!email) return { id: null, error: 'El correo electrónico es requerido' };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { id: null, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }

  const exists = await prisma.profile.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (exists) return { id: null, error: 'Ya existe un usuario con ese correo' };

  const id = crypto.randomUUID();
  await prisma.profile.create({
    data: {
      id,
      credential_id: id,
      email,
      fullname: input.fullname,
      role: input.role ?? 'CodeControlClient',
      password_hash: await bcrypt.hash(input.password, 12),
      email_verified_at: new Date(),
    },
  });
  return { id, error: null };
}
