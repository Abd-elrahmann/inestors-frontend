import React, { useState, useEffect, useCallback } from "react";
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
  Button,
  Stack,
  InputBase,
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Spin } from "antd";
import dayjs from "dayjs";
import AddInvestorModal from "../modals/AddInvestorModal";
import EditInvestorModal from "../modals/EditInvestorModal";

import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import {
  investorsAPI,
  transformers,
  handleApiError,
} from "../services/apiHelpers";
import {
  showDeleteConfirmation,
  showSuccessAlert,
  showErrorAlert,
} from "../utils/sweetAlert";
import { useCurrencyManager } from "../utils/globalCurrencyManager";
import { Helmet } from 'react-helmet-async';

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInvestors, setFilteredInvestors] = useState([]);

  const { formatAmount, currentCurrency } = useCurrencyManager();

  useEffect(() => {
    fetchInvestors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = investors.filter(investor => 
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.nationalId.includes(searchQuery) ||
      investor.phone.includes(searchQuery)
    );
    setFilteredInvestors(filtered);
  }, [investors, searchQuery]);

  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(error);

      const response = await investorsAPI.getAll({
        limit: rowsPerPage,
        page: page,
        search: searchQuery,    
      });

      if (response.data && response.data.investors) {
        const transformedInvestors = response.data.investors.map(
          transformers.investor
        );
        setInvestors(transformedInvestors);
        setFilteredInvestors(transformedInvestors);
      } else {
        throw new Error("تنسيق البيانات غير صحيح");
      }
    } catch (err) {
      console.error("Error fetching investors:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddInvestor = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleAddSuccess = useCallback(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleEditInvestor = useCallback((investor) => {
    setSelectedInvestor(investor);
    setShowEditModal(true);
  }, []);

  const handleDeleteInvestor = useCallback(
    async (investor) => {
      const confirmed = await showDeleteConfirmation(investor.name, "المساهم");

      if (confirmed) {
        try {
          await investorsAPI.delete(investor.id, { forceDelete: "true" });
          showSuccessAlert(
            `تم حذف المساهم "${investor.name}" نهائياً من النظام`
          );
          fetchInvestors();
        } catch (error) {
          showErrorAlert(`خطأ في حذف المساهم: ${error.message}`);
        }
      }
    },
    [fetchInvestors]
  );

  const handleEditSuccess = useCallback(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedInvestor(null);
  }, []);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>المساهمين</title>
        <meta name="description" content="المساهمين في نظام إدارة المساهمين" />
      </Helmet>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} mr={3} mt={2} spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddInvestor}
            startIcon={<PlusOutlined style={{marginLeft: '10px'}} />}
          >
            اضافة مساهم
          </Button>
            <InputBase
              placeholder="ابحث عن مساهم"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                width: '250px',
                pr: '35px'
              }}
            />
            <SearchOutlined style={{ 
              position: 'absolute',
              right: '8px',
              color: '#666'
            }} />
        </Stack>
      <Box className="content-area">
        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">اسم المساهم</StyledTableCell>
                <StyledTableCell align="center">رقم الهوية</StyledTableCell>
                <StyledTableCell align="center">رقم الهاتف</StyledTableCell>
                <StyledTableCell align="center">
                  المبلغ المساهم ({currentCurrency})
                </StyledTableCell>
                <StyledTableCell align="center">نسبة المساهمة</StyledTableCell>
                <StyledTableCell align="center">تاريخ الانضمام</StyledTableCell>
                <StyledTableCell align="center">تعديل</StyledTableCell>
                <StyledTableCell align="center">حذف</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={8} align="center">
                    <Spin size="large" /> 
                  </StyledTableCell>
                </StyledTableRow>
              ) : !filteredInvestors || filteredInvestors.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={8} align="center">
                    لا يوجد مساهمين
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                filteredInvestors.slice(0, rowsPerPage).map((investor) => (
                  <StyledTableRow key={investor.id}>
                    <StyledTableCell align="center">
                      {investor.name}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {investor.nationalId}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {investor.phone}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {formatAmount(investor.contribution / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), investor.originalCurrency || "IQD")}
                    </StyledTableCell>
                    <StyledTableCell align="center">{`${investor.sharePercentage}%`}</StyledTableCell>
                    <StyledTableCell align="center">
                      {dayjs(investor.joinDate).format("DD/MM/YYYY")}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleEditInvestor(investor)}
                      >
                        <EditOutlined />
                      </IconButton>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteInvestor(investor)}
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredInvestors.length}
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
        />

        <EditInvestorModal
          open={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          investor={selectedInvestor}
        />
      </Box>
    </>
  );
};

export default Investors;
