import React, { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Stack,
  InputBase,
  Fab,
  useMediaQuery
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Spin } from "antd";
import dayjs from "dayjs";
import AddInvestorModal from "../modals/AddInvestorModal";
import { RestartAltOutlined } from "@mui/icons-material";
import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import Api from "../services/api";
import { toast } from "react-toastify";
import { useCurrencyManager } from "../utils/globalCurrencyManager";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "react-query";
import DeleteModal from "../modals/DeleteModal";
import InvestorSearchModal from "../modals/InvestorSearchModal";
import { Link } from "react-router-dom";
import { debounce } from 'lodash';

const Investors = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const { formatAmount, currentCurrency } = useCurrencyManager();
  const isMobile = useMediaQuery('(max-width: 480px)');
  // Fetch investors query
  const {
    data: investorsData,
    isLoading,
    isFetching,
  } = useQuery(
    ["investors", page, rowsPerPage, searchQuery, advancedFilters],
    async () => {
      const params = {
        limit: rowsPerPage,
        search: searchQuery,
        ...advancedFilters,
      };

      const response = await Api.get(`/api/investors/${page}`, { params });
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    }
  );

  // Delete investor mutation
  const deleteInvestorMutation = useMutation(
    (investorId) => Api.delete(`/api/investors/${investorId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("investors");
        toast.success("تم حذف المساهم بنجاح");
      },
      onError: (error) => {
        console.error("Error deleting investor:", error);
        toast.error("فشل في حذف المساهم");
      },
    }
  );

  const handleAddSuccess = () => {
    queryClient.invalidateQueries("investors");
    setShowAddModal(false);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedInvestor(null);
    setShowDeleteModal(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedInvestor(null);
  };

  const handleOpenDeleteModal = (investor) => {
    setSelectedInvestor(investor);
    setShowDeleteModal(true);
  };

  const handleDeleteInvestor = async (investor) => {
    deleteInvestorMutation.mutate(investor.id);
    setShowDeleteModal(false);
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

  const fetchInvestorsQuery = () => {
    queryClient.invalidateQueries("investors");
  };

  const filteredInvestors = investorsData?.investors || [];

  return (
    <>
      <Helmet>
        <title>المساهمين</title>
        <meta name="description" content="المساهمين في نظام إدارة المساهمين" />
      </Helmet>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent= {isMobile ? 'center' : "space-between"}
        alignItems="center"
        mb={1}
        mr={3}
        mt={5}
        spacing={2}
      >
        <Fab
          color="primary"
          variant="extended"
          onClick={() => setShowAddModal(true)}
          sx={{
            borderRadius: "8px",
            fontWeight: "bold",
            textTransform: "none",
            height: "40px",
          }}
        >
          <PlusOutlined style={{ marginRight: 8 }} />
          إضافة مساهم
        </Fab>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
          <InputBase
            placeholder="بحث عن مساهم"
            startAdornment={
              <SearchOutlined
                style={{ marginLeft: "10px", marginRight: "10px" }}
              />
            }
            sx={{
              width: isMobile ? '100%' : '250px',
              padding: "8px 15px",
              marginLeft: "5px",
              borderRadius: "4px",
              fontSize: "16px",
            }}
            value={searchQuery}
            onChange={handleSearch}
          />

          <IconButton
            onClick={() => setSearchModalOpen(true)}
            sx={{ border: isMobile ? 'none' : "1px solid", borderColor: isMobile ? 'none' : "divider" }}
          >
            <FilterOutlined style={{ color: "green" }} />
          </IconButton>

          {(searchQuery || Object.keys(advancedFilters).length > 0) && (
            <IconButton
              onClick={() => {
                setSearchQuery("");
                fetchInvestorsQuery();
                setPage(1);
                setAdvancedFilters({});
              }}
              sx={{ border: isMobile ? 'none' : "1px solid", borderColor: isMobile ? 'none' : "divider" }}
            >
              <RestartAltOutlined style={{ color: "blue" }} />
            </IconButton>
          )}
        </Stack>
      </Stack>
      <Box className="content-area">
        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center"> مسلسل المساهم</StyledTableCell>
                <StyledTableCell align="center">اسم المساهم</StyledTableCell>
                <StyledTableCell align="center">
                  المبلغ المساهم ({currentCurrency})
                </StyledTableCell>
                <StyledTableCell align="center">نسبة المساهمة</StyledTableCell>
                <StyledTableCell align="center">تاريخ الانضمام</StyledTableCell>
                <StyledTableCell align="center">عرض المعاملات</StyledTableCell>
                <StyledTableCell align="center">حذف</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading || isFetching ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={6} align="center">
                    <Spin size="large" />
                  </StyledTableCell>
                </StyledTableRow>
              ) : !investorsData?.investors?.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={6} align="center">
                    لا يوجد مساهمين
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                <>
                  {filteredInvestors.map((investor) => (
                    <StyledTableRow key={investor.id}>
                      <StyledTableCell align="center">
                        {investor.userId}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {investor.fullName}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatAmount(investor.amount, "IQD")}
                      </StyledTableCell>
                      <StyledTableCell align="center">{`${investor.sharePercentage.toFixed(
                        2
                      )}%`}</StyledTableCell>
                      <StyledTableCell align="center">
                        {dayjs(investor.createdAt).format("DD/MM/YYYY")}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Link to={`/transactions/${investor.userId}`}>
                          <IconButton size="small">
                            <EyeOutlined style={{ color: "green" }} />
                          </IconButton>
                        </Link>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteModal(investor)}
                        >
                          <DeleteOutlined style={{ color: "red" }} />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                  <StyledTableRow>
                    <StyledTableCell
                      colSpan={2}
                      align="center"
                      sx={{ fontWeight: "bold" }}
                    >
                      الإجمالي
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ fontWeight: "bold" }}>
                      {formatAmount(
                        filteredInvestors.reduce(
                          (total, investor) => total + investor.amount,
                          0
                        ),
                        "IQD"
                      )}
                    </StyledTableCell>
                    <StyledTableCell colSpan={3} />
                  </StyledTableRow>
                </>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={investorsData?.totalInvestors || 0}
            page={page - 1}
            onPageChange={(e, newPage) => setPage(newPage + 1)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 20]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="عدد الصفوف في الصفحة"
          />
        </TableContainer>

        <AddInvestorModal
          open={showAddModal}
          onClose={handleCloseModal}
          onSuccess={handleAddSuccess}
          mode="normal"
          investorData={selectedInvestor}
        />

        <DeleteModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={() => handleDeleteInvestor(selectedInvestor)}
          title="حذف المساهم"
          message={`هل أنت متأكد من حذف المساهم؟`}
          isLoading={deleteInvestorMutation.isLoading}
          ButtonText="حذف"
        />

        <InvestorSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSearch={handleAdvancedSearch}
        />
      </Box>
    </>
  );
};

export default Investors;
