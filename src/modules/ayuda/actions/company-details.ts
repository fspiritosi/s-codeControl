'use server';

import { Logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';

const logger = new Logger('features/Ayuda/company-details');

export async function getCompanyDetails(companyId: string) {
  try {
    return await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, company_name: true, website: true, contact_email: true, company_logo: true },
    });
  } catch (error) {
    logger.error('Error fetching company details', { data: { error } });
    return null;
  }
}
