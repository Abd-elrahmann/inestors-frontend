// services/financialYearsApi.js
import Api from "../../services/api";

export const financialYearsApi = {
  getFinancialYears: (page, params) => 
    Api.get(`/api/financial-years/all/${page}`, { params }),

  getDistributions: (yearId) => 
    Api.get(`/api/financial-years/${yearId}/distributions`),

  approveFinancialYear: (yearId) => 
    Api.patch(`/api/financial-years/${yearId}/approve`),

  deleteFinancialYear: (yearId) => 
    Api.delete(`/api/financial-years/${yearId}`)
};

export const financialYearsKeys = {
  all: ["financialYears"],
  lists: () => [...financialYearsKeys.all, 'list'],
  list: (filters) => [...financialYearsKeys.lists(), filters],
  details: () => [...financialYearsKeys.all, 'detail'],
  detail: (id) => [...financialYearsKeys.details(), id],
  distributions: (id) => [...financialYearsKeys.detail(id), 'distributions'],
};