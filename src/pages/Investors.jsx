import React, { useState } from "react";
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

import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import Api from "../services/api";
import toast from 'react-hot-toast';
import { useCurrencyManager } from "../utils/globalCurrencyManager";
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from "react-query";
import DeleteModal from "../modals/DeleteModal";
const Investors = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { formatAmount, currentCurrency } = useCurrencyManager();

  // Fetch investors query
  const { data: investorsData, isLoading } = useQuery(
    ['investors', page, rowsPerPage, searchQuery],
    async () => {
      const response = await Api.get(`/api/investors/${page}`, {
        params: {
          limit: rowsPerPage,
          search: searchQuery
        }
      });
      return response.data;
    }
  );

  // Delete investor mutation
  const deleteInvestorMutation = useMutation(
    (investorId) => Api.delete(`/api/investors/${investorId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('investors');
        toast.success('تم حذف المساهم بنجاح');
      },
      onError: (error) => {
        console.error('Error deleting investor:', error);
        toast.error('فشل في حذف المساهم');
      }
    }
  );

  const handleAddInvestor = () => {
    setSelectedInvestor(null);
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries('investors');
    setShowAddModal(false);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedInvestor(null);
    setShowDeleteModal(false);
  };

  const handleEditInvestor = (investor) => {
    setSelectedInvestor(investor);
    setShowAddModal(true);
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
              {isLoading ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={7} align="center">
                    <Spin size="large" /> 
                  </StyledTableCell>
                </StyledTableRow>
              ) : !investorsData?.investors?.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={7} align="center">
                    لا يوجد مساهمين
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                <>
                  {investorsData.investors.map((investor) => (
                    <StyledTableRow key={investor.id}>
                      <StyledTableCell align="center">
                        {investor.userName}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {investor.phone}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatAmount(investor.amount, currentCurrency)}
                      </StyledTableCell>
                      <StyledTableCell align="center">{`${investor.sharePercentage}%`}</StyledTableCell>
                      <StyledTableCell align="center">
                        {dayjs(investor.createdAt).format("DD/MM/YYYY")}
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
                          onClick={() => handleOpenDeleteModal(investor)}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                  <StyledTableRow>
                    <StyledTableCell colSpan={2} align="center" sx={{ fontWeight: 'bold' }}>
                      الإجمالي
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {formatAmount(investorsData.investors.reduce((total, investor) => total + investor.amount, 0), currentCurrency)}
                    </StyledTableCell>
                    <StyledTableCell colSpan={4} />
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
          editMode={!!selectedInvestor}
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

      </Box>
    </>
  );
};

export default Investors;
