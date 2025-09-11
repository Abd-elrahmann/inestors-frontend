import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Fab,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  InputBase,
  InputAdornment,
  Card,
  Typography,
  useMediaQuery,
  Checkbox,
} from "@mui/material";
import { toast } from "react-toastify";
import { Spin } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { RestartAltOutlined } from "@mui/icons-material";
import AddTransactionModal from "../modals/AddTransactionModal";
import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import Api from "../services/api";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "react-query";
import DeleteModal from "../modals/DeleteModal";
import TransactionsSearchModal from "../modals/TransactionsSearchModal";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../utils/user";
import { debounce } from 'lodash';
import { useSettings } from "../hooks/useSettings";
import CancelTransactionModal from "../modals/CancelTransactionModal";

const Transactions = () => {
  const { investorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [profile, setProfile] = useState(user);
  useEffect(() => {
    setProfile(user);
  }, [user]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const { data: settings } = useSettings();
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!settings?.USDtoIQD) return amount;
    
    if (fromCurrency === 'IQD' && toCurrency === 'USD') {
      return amount / settings.USDtoIQD;
    } else if (fromCurrency === 'USD' && toCurrency === 'IQD') {
      return amount * settings.USDtoIQD;
    }
    return amount;
  };

  const isMobile = useMediaQuery('(max-width: 480px)');

  // Fetch transactions query
  const {
    data: transactionsData,
    isLoading,
    isFetching,
  } = useQuery(
    ["transactions", page, rowsPerPage, searchQuery, advancedFilters, investorId],
    async () => {
      const params = {
        limit: rowsPerPage,
        ...(investorId ? { investorId } : isNaN(searchQuery) ? { search: searchQuery } : { investorId: searchQuery }),
        ...advancedFilters,
      };

      const response = await Api.get(`/api/transactions/${page}`, { params });
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    }
  );

  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation(
    (transactionId) => Api.patch(`/api/transactions/${transactionId}/cancel`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("transactions");
        queryClient.invalidateQueries("investors");
        setShowCancelModal(false);
        setSelectedTransaction(null);
        toast.success("تم الغاء العملية بنجاح");
      },
      onError: (error) => {
        console.error("Error canceling transaction:", error);
        toast.error("فشل في الغاء العملية");
        setShowCancelModal(false);
        setSelectedTransaction(null);
      },
    }
  );

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation(
    (transactionId) => Api.delete(`/api/transactions/${transactionId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("transactions");
        setShowDeleteModal(false);
        setSelectedTransaction(null);
        setSelectedIds([]);
        toast.success("تم حذف العملية بنجاح");
      },
      onError: (error) => {
        console.error("Error deleting transaction:", error);
        toast.error("فشل في حذف العملية");
      },
    }
  );

  const deleteTransactionsMutation = useMutation(
    (ids) => Api.delete('/api/transactions', { data: { ids } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("transactions");
        setShowDeleteModal(false);
        setSelectedTransaction(null);
        setSelectedIds([]);
        toast.success("تم حذف العمليات بنجاح");
      },
      onError: (error) => {
        console.error("Error deleting transactions:", error);
        toast.error("فشل في حذف العمليات");
      }
    }
  );

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

  const handleOpenCancelModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowCancelModal(true);
  };

  const handleCancelTransaction = async (transactionId) => {
    try {
      await cancelTransactionMutation.mutateAsync(transactionId);
    } catch (error) {
      console.error("Error canceling transaction:", error);
      toast.error("فشل في الغاء العملية");
      setShowCancelModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    try {
      if (selectedIds.length > 0) {
        await deleteTransactionsMutation.mutateAsync(selectedIds);
      } else if (transaction?.id) {
        await deleteTransactionMutation.mutateAsync(transaction.id);
      }
    } catch (error) {
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

  const debouncedSearch = useMemo(() => debounce((val) => {
    setSearchQuery(val);
    setPage(1);
  }, 300), []);

  const handleSearch = (event) => {
    debouncedSearch(event.target.value);
    setPage(1);
  };

  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    setPage(1);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked && transactionsData?.transactions) {
      const newSelectedIds = transactionsData.transactions.map((transaction) => transaction.id);
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (event, id) => {
    if (!id) return;
    
    if (event.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "ايداع";
      case "WITHDRAWAL":
        return "سحب";
      case "PROFIT":
        return "ربح";
      default:
        return "غير محدد";
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "warning";
      case "WITHDRAWAL":
        return "error";
      case "PROFIT":
        return "primary";
      default:
        return "default";
    }
  };

  const transactions = transactionsData?.transactions || [];
  const totalTransactions = transactionsData?.totalTransactions || 0; 
  const totalPages = transactionsData?.totalPages || 0; 
  const investorDetails = transactions[0]?.investors;
  const currency = settings?.defaultCurrency || 'USD';

  const isAdmin = profile?.role === 'ADMIN';  

  return (
    <>
      <Helmet>
        <title>المعاملات</title>
        <meta name="description" content="المعاملات في نظام إدارة المساهمين" />
      </Helmet>
      <Box className="content-area">
        {investorId && (
          <Card sx={{ p: 2, mb: 3, mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                المساهم: {investorDetails?.fullName}
              </Typography>
              <Typography variant="h6">
                إجمالي المبالغ: {convertCurrency(transactions.reduce((total, transaction) => {
                  return transaction.status !== 'CANCELED' ? total + (transaction?.amount || 0) : total;
                }, 0), currency, settings?.defaultCurrency).toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
              </Typography>
              <Typography variant="h6">
                العملة: {currency}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="flex-start" alignItems="center" marginTop={2}>
              <Fab
                variant="extended"
                color="primary"
                onClick={() => navigate('/investors')}
                sx={{
                  borderRadius: "8px",
                  fontWeight: "bold",
                  textTransform: "none",
                  height: "40px",
                }}
              >
                <ArrowLeftOutlined style={{ marginLeft: "10px" }} />
                الرجوع لصفحة المساهمين
              </Fab>
            </Stack>
          </Card>
        )}

          <Stack
          direction={isMobile ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems="center"
          mb={1}
          mt={5}
          spacing={2}
        >
          <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
            {isAdmin && (
              <>
                <Fab
                  variant="extended"
                  color="primary"
                  onClick={handleAddTransaction}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: "bold",
                    textTransform: "none",
                    height: "40px",
                    width: isMobile ? '100%' : '180px',
                  }}
                >
                  <PlusOutlined style={{ marginLeft: 8 }} />
                  إضافة عملية جديدة
                </Fab>
                {selectedIds.length > 0 && (
                  <IconButton
                    color="error"
                    variant="extended"
                    onClick={() => setShowDeleteModal(true)}
                    sx={{
                      width: isMobile ? '100%' : '100px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      height: '40px',
                      fontSize: '14px',
                      order: isMobile ? 1 : 0
                    }}
                  >
                    <DeleteOutlined style={{ marginLeft: 8 }} />
                    ({selectedIds.length})
                  </IconButton>
                )}
              </>
            )}
          </Stack>

          <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
            {isAdmin && (
              <>
                <InputBase
                  placeholder="ابحث عن عملية..."
                  value={searchQuery}
                  onChange={handleSearch}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined
                        style={{ color: "#666", marginRight: "10px" }}
                      />
                    </InputAdornment>
                  }
                  sx={{
                    width: isMobile ? '100%' : '250px',
                    padding: "8px 15px",
                    marginLeft: "5px",
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />

                <IconButton
                  onClick={() => setSearchModalOpen(true)}
                  sx={{ border: isMobile ? 'none' : "1px solid", borderColor: isMobile ? 'none' : "divider" }}
                >
                  <FilterOutlined />
                </IconButton>
                {(searchQuery || Object.keys(advancedFilters).length > 0) && (
                  <IconButton
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                      setAdvancedFilters({});
                    }}
                    sx={{ border: isMobile ? 'none' : "1px solid", borderColor: isMobile ? 'none' : "divider" }}
                  >
                    <RestartAltOutlined style={{ color: "red" }} />
                  </IconButton>
                )}
              </>
            )}
          </Stack>
        </Stack>
        <TableContainer component={Paper} sx={{ maxHeight: 650,scrollbarWidth: 'none' }}>
  <Table stickyHeader>
    <TableHead>
      <TableRow>
        <StyledTableCell padding="checkbox">
          <Checkbox
          style={{color: 'white'}}
            checked={selectedIds.length === transactions.length && transactions.length > 0}
            indeterminate={selectedIds.length > 0 && selectedIds.length < transactions.length}
            onChange={handleSelectAll}
          />
        </StyledTableCell>
        <StyledTableCell align="center">مسلسل العملية</StyledTableCell>
        <StyledTableCell align="center">اسم المساهم</StyledTableCell>
        <StyledTableCell align="center">نوع المعاملة</StyledTableCell>
        <StyledTableCell align="center">
          المبلغ ({settings?.defaultCurrency})
        </StyledTableCell>
        <StyledTableCell align="center">العملة</StyledTableCell>
        <StyledTableCell align="center">مصدر العملية</StyledTableCell>
        <StyledTableCell align="center">السنة المالية</StyledTableCell>
        <StyledTableCell align="center">تاريخ المعاملة</StyledTableCell>
        <StyledTableCell align="center">الحالة</StyledTableCell>
        <StyledTableCell align="center">الغاء العملية</StyledTableCell>
        {isAdmin && <StyledTableCell align="center">حذف</StyledTableCell>}
      </TableRow>
    </TableHead>
    <TableBody>
      {isLoading || isFetching ? (
        <StyledTableRow>
          <StyledTableCell colSpan={isAdmin ? 11 : 10} align="center">
            <Spin size="large" />
          </StyledTableCell>
        </StyledTableRow>
      ) : transactions.length === 0 ? (
        <StyledTableRow>
          <StyledTableCell colSpan={isAdmin ? 11 : 10} align="center">
            لا توجد معاملات
          </StyledTableCell>
        </StyledTableRow>
      ) : (
        transactions.map((transaction) => (
          <StyledTableRow key={transaction.id}>
            <StyledTableCell padding="checkbox">
              <Checkbox
                checked={selectedIds.includes(transaction.id)}
                onChange={(event) => handleSelectOne(event, transaction.id)}
              />
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.id || "غير محدد"}
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.investors?.fullName || "غير محدد"}
            </StyledTableCell>
            <StyledTableCell align="center">
              <Chip
                label={getTransactionTypeLabel(transaction.type)}
                color={getTransactionTypeColor(transaction.type)}
                variant="outlined"
                sx={{
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
            </StyledTableCell>
            <StyledTableCell align="center">
              {convertCurrency(
                transaction.amount,
                transaction.currency || "USD",
                settings?.defaultCurrency
              ).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.currency || "USD"}
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.withdrawSource === "AMOUNT_ROLLOVER" ? " مبلغ الربح + رأس المال" : transaction.withdrawSource === "ROLLOVER" ? "مبلغ الربح" : "-"}
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.financialYear?.year || "-"} {transaction.financialYear?.periodName ? `- ${transaction.financialYear.periodName}` : ''}
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.date? transaction.date : "-"}
            </StyledTableCell>
            <StyledTableCell align="center">
              {transaction.status === "CANCELED" ? (
                <Chip
                  label="ملغاة"
                  color="error"
                  variant="outlined"
                  size="small"
                />
              ) : "-"}
            </StyledTableCell>
            <StyledTableCell align="center">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleOpenCancelModal(transaction)}
                disabled={transaction.status === "CANCELED"}
              >
                <CloseOutlined />
              </IconButton>
            </StyledTableCell>
            {isAdmin && (
              <StyledTableCell align="center">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleOpenDeleteModal(transaction)}
                >
                  <DeleteOutlined />
                </IconButton>
              </StyledTableCell>
            )}
          </StyledTableRow>
        ))
      )}
    </TableBody>
  </Table>
  {isAdmin && (
    <TablePagination
      component="div"
      count={totalTransactions} 
      totalPages={totalPages}
      page={page - 1}
      onPageChange={(e, newPage) => setPage(newPage + 1)}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[5, 10, 20]}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="عدد الصفوف في الصفحة"
    />
  )}
</TableContainer>

        <AddTransactionModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />

        <DeleteModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={() => handleDeleteTransaction(selectedTransaction)}
          title={selectedIds.length > 0 ? "حذف العمليات المحددة" : "حذف العملية"}
          message={selectedIds.length > 0 ? `هل أنت متأكد من حذف ${selectedIds.length} عمليات؟` : `هل أنت متأكد من حذف العملية؟`}
          isLoading={deleteTransactionMutation.isLoading || deleteTransactionsMutation.isLoading}
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
          onConfirm={() => handleCancelTransaction(selectedTransaction.id)}
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
