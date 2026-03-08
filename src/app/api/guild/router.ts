import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Crear un nuevo registro en la tabla 'guild'
export async function POST(request: NextRequest) {
  const { company_id, ...guildData } = await request.json();

  try {
    const data = await prisma.guild.create({
      data: { company_id, ...guildData },
    });

    return NextResponse.json({ guild: data });
  } catch (error) {
    console.error('Error creating guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Leer registros de la tabla 'guild'
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('company_id');

  try {
    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Actualizar un registro existente en la tabla 'guild'
export async function PUT(request: NextRequest) {
  const { id, ...guildData } = await request.json();

  try {
    const data = await prisma.guild.update({
      where: { id },
      data: guildData,
    });

    return NextResponse.json({ guild: data });
  } catch (error) {
    console.error('Error updating guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Eliminar un registro de la tabla 'guild'
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  try {
    const data = await prisma.guild.delete({
      where: { id },
    });

    return NextResponse.json({ guild: data });
  } catch (error) {
    console.error('Error deleting guild:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
