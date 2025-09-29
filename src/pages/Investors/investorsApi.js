// services/investorsApi.js
import Api from "../../services/api";

export const investorsApi = {
  getInvestors: (page, params) => 
    Api.get(`/api/investors/${page}`, { params }),

  deleteInvestor: (investorId) => 
    Api.delete(`/api/investors/${investorId}`),

  deleteInvestors: (ids) => 
    Api.delete("/api/investors", { data: { ids } }),

  importInvestors: (formData) => 
    Api.post("/api/investors/import", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
};

export const investorsKeys = {
  all: ["investors"],
  lists: () => [...investorsKeys.all, 'list'],
  list: (filters) => [...investorsKeys.lists(), filters],
  details: () => [...investorsKeys.all, 'detail'],
  detail: (id) => [...investorsKeys.details(), id],
};