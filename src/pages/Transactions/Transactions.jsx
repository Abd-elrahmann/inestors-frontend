import React, { useState, useMemo, useEffect } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { debounce } from "lodash";
import { useParams } from "react-router-dom";

import TransactionsToolbar from "../../components/Transactions/TransactionsToolbar";
import TransactionsTable from "../../components/Transactions/TransactionsTable";
import AddTransactionModal from "../../modals/AddTransactionModal";
import DeleteModal from "../../modals/DeleteModal";
import TransactionsSearchModal from "../../modals/TransactionsSearchModal";
import CancelTransactionModal from "../../modals/CancelTransactionModal";

import { transactionsApi } from "./transactionsApi";
import { useUser } from "../../utils/user";
import { useSettings } from "../../hooks/useSettings";

const Transactions = () => {
  const { investorId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [profile, setProfile] = useState(user);
  const { data: settings } = useSettings();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isMobile = useMediaQuery("(max-width: 480px)");

  const [orderBy, setOrderBy] = useState(() => {
    const saved = localStorage.getItem("transactions_sort_orderBy");
    return saved || "id";
  });
  const [order, setOrder] = useState(() => {
    const saved = localStorage.getItem("transactions_sort_order");
    return saved || "asc";
  });

  useEffect(() => {
    setProfile(user);
  }, [user]);

  useEffect(() => {
    localStorage.setItem("transactions_sort_orderBy", orderBy);
  }, [orderBy]);

  useEffect(() => {
    localStorage.setItem("transactions_sort_order", order);
  }, [order]);

  const {
    data: transactionsData,
    isLoading,
    isFetching,
  } = useQuery(
    [
      "transactions",
      page,
      rowsPerPage,
      searchQuery,
      advancedFilters,
      investorId,
      orderBy,
      order,
    ],
    async () => {
      const params = {
        limit: rowsPerPage,
        search: searchQuery,
        ...advancedFilters,
        sortBy: orderBy,
        sortOrder: order,
      };

      if (investorId) {
        params.investorId = investorId;
      }

      const response = await transactionsApi.getTransactions(page, params);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    }
  );

  // Mutations
  const cancelTransactionMutation = useMutation(transactionsApi.cancelTransaction, {
    onSuccess: () => {
      queryClient.invalidateQueries("transactions");
      queryClient.invalidateQueries("investors");
      setShowCancelModal(false);
      setSelectedTransaction(null);
      toast.success("تم الغاء العملية بنجاح");
    },
    onError: (error) => {
      console.error("Error canceling transaction:", error);
      toast.error(error.message || 'فشل في الغاء العملية');
      setShowCancelModal(false);
      setSelectedTransaction(null);
    },
  });

  const deleteTransactionMutation = useMutation(transactionsApi.deleteTransaction, {
    onSuccess: () => {
      queryClient.invalidateQueries("transactions");
      setShowDeleteModal(false);
      setSelectedTransaction(null);
      setSelectedIds([]);
      toast.success("تم حذف العملية بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting transaction:", error);
      toast.error(error.message || 'فشل في حذف العملية');
    },
  });

  const deleteTransactionsMutation = useMutation(transactionsApi.deleteTransactions, {
    onSuccess: () => {
      queryClient.invalidateQueries("transactions");
      setShowDeleteModal(false);
      setSelectedTransaction(null);
      setSelectedIds([]);
      toast.success("تم حذف العمليات بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting transactions:", error);
      toast.error(error.message || 'فشل في حذف العمليات');
    },
  });

  const handleAddTransaction = () => {
    setAddModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedTransaction(null);
  };

  const handleOpenDeleteModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    setShowDeleteModal(true);
  };

  const handleOpenCancelModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowCancelModal(true);
  };

  const handleCancelTransaction = async (transactionId) => {
    try {
      await cancelTransactionMutation.mutateAsync(transactionId);
    } catch (error) {
      console.error("Error canceling transaction:", error);
      toast.error(error.message || 'فشل في الغاء العملية');
      setShowCancelModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleDeleteTransaction = async () => {
    try {
      if (selectedIds.length > 0) {
        await deleteTransactionsMutation.mutateAsync(selectedIds);
      } else if (selectedTransaction?.id) {
        await deleteTransactionMutation.mutateAsync(selectedTransaction.id);
      }
    } catch (error) {
      toast.error(error.message || 'فشل في حذف العملية');
      console.error("Error in delete operation:", error);
    }
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries("transactions");
    setAddModalOpen(false);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce(
        (val) => {
          setSearchQuery(val);
          setPage(1);
        },
        150,
        { leading: true }
      ),
    []
  );

  const handleSearch = (event) => {
    debouncedSearch(event.target.value);
  };

  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPage(1);
    setAdvancedFilters({});
    setOrderBy("id");
    setOrder("asc");
    localStorage.removeItem("transactions_sort_orderBy");
    localStorage.removeItem("transactions_sort_order");
  };

  const handleSelectAll = (event) => {
    if (event.target.checked && transactionsData?.transactions) {
      const newSelectedIds = transactionsData.transactions.map(
        (transaction) => transaction.id
      );
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (event, id) => {
    if (!id) return;

    if (event.target.checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(1);
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!settings?.USDtoIQD) return amount;

    if (fromCurrency === "IQD" && toCurrency === "USD") {
      return amount / settings.USDtoIQD;
    } else if (fromCurrency === "USD" && toCurrency === "IQD") {
      return amount * settings.USDtoIQD;
    }
    return amount;
  };

  const transactions = transactionsData?.transactions || [];
  const investorDetails = transactions[0]?.investors;
  const isAdmin = profile?.role === "ADMIN";
  const showResetButton = searchQuery || Object.keys(advancedFilters).length > 0;

  const totalAmount = transactions.reduce((total, transaction) => {
    if (transaction.status === "CANCELED") return total;

    if (transaction.type === "WITHDRAWAL") {
      return total - (transaction?.amount || 0);
    }

    return total + (transaction?.amount || 0);
  }, 0);

  return (
    <>
      <Helmet>
        <title>المعاملات</title>
        <meta name="description" content="المعاملات في نظام إدارة المساهمين" />
      </Helmet>
      
      <Box className="content-area">
        <TransactionsToolbar
          isMobile={isMobile}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onAddTransaction={handleAddTransaction}
          selectedIds={selectedIds}
          onBulkDelete={handleBulkDelete}
          onOpenSearchModal={() => setSearchModalOpen(true)}
          onResetFilters={handleResetFilters}
          showResetButton={showResetButton}
          isAdmin={isAdmin}
          investorId={investorId}
          investorDetails={investorDetails}
          totalAmount={totalAmount}
          settings={settings}
          convertCurrency={convertCurrency}
        />

        <TransactionsTable
          transactionsData={transactionsData}
          isLoading={isLoading}
          isFetching={isFetching}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          orderBy={orderBy}
          order={order}
          onRequestSort={handleRequestSort}
          settings={settings}
          onCancelTransaction={handleOpenCancelModal}
          onDeleteTransaction={handleOpenDeleteModal}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          convertCurrency={convertCurrency}
          isAdmin={isAdmin}
          transactions={transactions}
        />

        {/* Modals */}
        <AddTransactionModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />

        <DeleteModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteTransaction}
          title={selectedIds.length > 0 ? "حذف العمليات المحددة" : "حذف العملية"}
          message={
            selectedIds.length > 0
              ? `هل أنت متأكد من حذف ${selectedIds.length} عمليات؟`
              : `هل أنت متأكد من حذف العملية؟`
          }
          isLoading={
            deleteTransactionMutation.isLoading ||
            deleteTransactionsMutation.isLoading
          }
          ButtonText="حذف"
        />

        <TransactionsSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSearch={handleAdvancedSearch}
          transactions={transactions}
        />

        <CancelTransactionModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => handleCancelTransaction(selectedTransaction?.id)}
          isLoading={cancelTransactionMutation.isLoading}
          title="الغاء العملية"
          message="هل أنت متأكد من الغاء العملية؟"
          ButtonText="الغاء العملية"
        />
      </Box>
    </>
  );
};

export default Transactions;