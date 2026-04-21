'use server';
import { prisma } from '@/shared/lib/prisma';

// --- From company/queries.ts ---

export const fetchCountries = async () => {
  try {
    const data = await prisma.countries.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

export const fetchProvinces = async () => {
  try {
    const data = await prisma.provinces.findMany({
      select: { id: true, name: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

export const fetchCitiesByProvince = async (provinceId: number) => {
  try {
    const data = await prisma.cities.findMany({
      where: { province_id: provinceId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};
