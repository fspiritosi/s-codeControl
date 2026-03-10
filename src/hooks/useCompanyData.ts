'use client';
import { useLoggedUserStore } from '@/store/loggedUser';
import { company } from './../types/types';
import { useEdgeFunctions } from './useEdgeFunctions';
import {
  fetchAllCompaniesWithRelations,
  fetchCompaniesByOwnerId,
  fetchIndustryTypes,
} from '@/app/server/GET/actions';
import {
  insertCompany as insertCompanyAction,
  updateCompanyById,
  logicDeleteCompanyById,
  deleteCompanyById,
} from '@/app/server/UPDATE/actions';

export const useCompanyData = () => {
  const { errorTranslate } = useEdgeFunctions();

  return {
    fetchAllCompany: async () => {
      const data = await fetchAllCompaniesWithRelations();
      return data;
    },

    findByOwner: async (owner: string) => {
      const data = await fetchCompaniesByOwnerId(owner);
      return data;
    },
    insertCompany: async (company: company) => {
      const { data, error } = await insertCompanyAction(company as any);

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },

    updateCompany: async (companyId: string, company: company) => {
      const { data, error } = await updateCompanyById(companyId, company as any);

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    LogicDeleteCompany: async (companyId: string) => {
      const { data, error } = await logicDeleteCompanyById(companyId);
      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },

    deleteCompany: async (companyId: string) => {
      const { error } = await deleteCompanyById(companyId);

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
    },

    fetchIndustryType: async () => {
      const data = await fetchIndustryTypes();
      return data;
    },

    fetchCompanies: async () => {
      const data = await fetchAllCompaniesWithRelations();
      useLoggedUserStore.setState({ allCompanies: data || [] });
    },
  };
};
