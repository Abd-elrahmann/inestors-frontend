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
} from "@ant-design/icons";
import AddTransactionModal from "../modals/AddTransactionModal";
import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import Api from "../services/api";
import { useCurrencyManager } from "../utils/globalCurrencyManager";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "react-query";
import DeleteModal from "../modals/DeleteModal";
import TransactionsSearchModal from "../modals/TransactionsSearchModal";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../utils/user";
import { debounce } from 'lodash';
import { useSettings } from "../hooks/useSettings";

const Transactions = () => {
  const { userId } = useParams();
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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const { data: settingsData = {} } = useSettings();
  const { formatAmount, currentCurrency } = useCurrencyManager();
  const isMobile = useMediaQuery('(max-width: 480px)');
  // Fetch transactions query
  const {
    data: transactionsData,
    isLoading,
    isFetching,
  } = useQuery(
    ["transactions", page, rowsPerPage, searchQuery, advancedFilters, userId],
    async () => {
      const params = {
        limit: rowsPerPage,
        ...(userId ? { userId } : isNaN(searchQuery) ? { search: searchQuery } : { userId: searchQuery }),
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

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation(
    (transactionId) => Api.delete(`/api/transactions/${transactionId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("transactions");
        toast.success("تم حذف العملية بنجاح");
      },
      onError: (error) => {
        console.error("Error deleting transaction:", error);
        toast.error("فشل في حذف العملية");
      },
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

  const handleDeleteTransaction = async (transaction) => {
    deleteTransactionMutation.mutate(transaction.id);
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

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "deposit":
        return "ايداع";
      case "withdrawal":
        return "سحب";
      case "profit":
        return "أرباح";
      default:
        return "غير محدد";
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "deposit":
        return "success";
      case "withdrawal":
        return "error";
      case "profit":
        return "info";
      default:
        return "default";
    }
  };

  const transactions = transactionsData?.transactions || [];
  const totalTransactions = transactionsData?.totalTransactions || 0;
  const investorDetails = transactions[0]?.user;
  const amount = transactions.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);
  const currency = settingsData?.defaultCurrency || 'IQD';

  const isAdmin = profile?.role === 'ADMIN';  

  return (
    <>
      <Helmet>
        <title>المعاملات</title>
        <meta name="description" content="المعاملات في نظام إدارة المساهمين" />
      </Helmet>
      <Box className="content-area">
        {userId && (
          <Card sx={{ p: 2, mb: 3, mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                المساهم: {investorDetails?.fullName}
              </Typography>
              <Typography variant="h6">
                إجمالي المبالغ: {formatAmount(amount, currency)}
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
          {isAdmin && (
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
          )}

          <Stack direction={isMobile ? 'column' : 'row'} justifyContent={isMobile ? 'center' : 'space-between'} spacing={1}>
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
              </>
            )}
          </Stack>
        </Stack>

        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">مسلسل المساهم</StyledTableCell>
                <StyledTableCell align="center">اسم المساهم</StyledTableCell>
                <StyledTableCell align="center">نوع المعاملة</StyledTableCell>
                <StyledTableCell align="center">
                  المبلغ ({currentCurrency})
                </StyledTableCell>
                <StyledTableCell align="center">العملة</StyledTableCell>
                <StyledTableCell align="center">تاريخ المعاملة</StyledTableCell>
                {isAdmin && <StyledTableCell align="center">حذف</StyledTableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading || isFetching ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={isAdmin ? 6 : 5} align="center">
                    <Spin size="large" />
                  </StyledTableCell>
                </StyledTableRow>
              ) : transactions.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={isAdmin ? 6 : 5} align="center">
                    لا توجد معاملات
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                transactions.map((transaction) => (
                  <StyledTableRow key={transaction.id}>
                    <StyledTableCell align="center">
                      {transaction.investorId || "غير محدد"}
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
                      {formatAmount(
                        transaction.amount,
                        transaction.currency || "IQD"
                      )}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {transaction.currency || "IQD"}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {dayjs(transaction.date)
                        ? transaction.date
                        : "غير محدد"}
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
          title="حذف العملية"
          message={`هل أنت متأكد من حذف العملية؟`}
          isLoading={deleteTransactionMutation.isLoading}
          ButtonText="حذف"
        />

        <TransactionsSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSearch={handleAdvancedSearch}
        />
      </Box>
    </>
  );
};

export default Transactions;
