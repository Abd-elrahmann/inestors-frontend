import Api from "../../services/api";

export const transactionsApi = {
  getTransactions: (page, params) => 
    Api.get(`/api/transactions/${page}`, { params }),

  cancelTransaction: (transactionId) => 
    Api.patch(`/api/transactions/${transactionId}/cancel`),

  deleteTransaction: (transactionId) => 
    Api.delete(`/api/transactions/${transactionId}`),

  deleteTransactions: (ids) => 
    Api.delete("/api/transactions", { data: { ids } })
};

export const transactionsKeys = {
  all: ["transactions"],
  lists: () => [...transactionsKeys.all, 'list'],
  list: (filters) => [...transactionsKeys.lists(), filters],
  details: () => [...transactionsKeys.all, 'detail'],
  detail: (id) => [...transactionsKeys.details(), id],
};