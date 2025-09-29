import api from "../../services/api";

export const reportsApi = {
  getInvestorsReport: (params) => 
    api.get("/api/reports/investors", { params }),

  getIndividualInvestorReport: (investorId, periodName = null) => {
    const url = periodName 
      ? `/api/reports/investors/${investorId}/${periodName}`
      : `/api/reports/investors/${investorId}`;
    return api.get(url);
  },

  getTransactionsReport: (params) => 
    api.get("/api/reports/transactions", { params }),

  getFinancialYearReport: (periodName) => 
    api.get(`/api/reports/financial-years/${encodeURIComponent(periodName)}`),

  getInvestors: (searchTerm = "", page = 1, limit = 10) =>
    api.get(`/api/investors/${page}`, {
      params: {
        limit,
        ...(searchTerm && { fullName: searchTerm }),
      }
    }),

  getFinancialYears: (searchTerm = "", page = 1, limit = 10) =>
    api.get(`/api/financial-years/all/${page}`, {
      params: {
        limit,
        search: searchTerm ? searchTerm : undefined,
      }
    })
};

export const reportsKeys = {
  all: ["reports"],
  investors: () => [...reportsKeys.all, 'investors'],
  individual: (investorId, periodName) => [...reportsKeys.all, 'individual', investorId, periodName],
  transactions: () => [...reportsKeys.all, 'transactions'],
  financialYear: (periodName) => [...reportsKeys.all, 'financial-year', periodName],
};