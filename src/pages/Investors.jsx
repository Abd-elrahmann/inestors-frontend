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
  FilterOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from "@ant-design/icons";
import { Spin } from "antd";
import dayjs from "dayjs";
import AddInvestorModal from "../modals/AddInvestorModal";

import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import Api from "../services/api";
import { toast } from 'react-toastify';
import { useCurrencyManager } from "../utils/globalCurrencyManager";
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from "react-query";
import DeleteModal from "../modals/DeleteModal";
import InvestorSearchModal from "../modals/InvestorSearchModal";

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

  // Fetch investors query
  const { data: investorsData, isLoading, isFetching } = useQuery(
    ['investors', page, rowsPerPage, searchQuery, advancedFilters],
    async () => {
      const params = {
        limit: rowsPerPage,
        search: searchQuery,
        ...advancedFilters
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
        queryClient.invalidateQueries('investors');
        toast.success('تم حذف المساهم بنجاح');
      },
      onError: (error) => {
        console.error('Error deleting investor:', error);
        toast.error('فشل في حذف المساهم');
      }
    }
  );

  const handleAddSuccess = () => {
    queryClient.invalidateQueries('investors');
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
  
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };
  
  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    setPage(1);
  };

  const filteredInvestors = investorsData?.investors || [];

  const exportToPDF = async (exportAll = false) => {
    try { 
      const response = await Api.get('/api/investors/1');
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      const doc = new jsPDFModule.default();
      
      doc.addFont("/assets/fonts/Amiri-Regular.ttf", "Amiri", "normal");
      doc.addFont("/assets/fonts/Amiri-Bold.ttf", "Amiri", "bold");
      doc.setFont("Amiri");
      doc.setFontSize(16);
      doc.text('Investors Report | Report Date: ' + new Date().toLocaleDateString(), 14, 15);

      const columns = ['المسلسل', 'اسم المساهم', 'المبلغ المساهم', 'نسبة المساهمة', 'الدور', 'تاريخ الانضمام'];
      
      const dataToExport = exportAll ? response.data.investors : investorsData.investors.slice(0, rowsPerPage);

      const rows = dataToExport.map(investor => [
        investor.userId,
        investor.fullName,
        investor.amount,
        investor.sharePercentage.toFixed(2),
        investor.role === 'ADMIN' ? 'ادمن' : 'مساهم',
        dayjs(investor.createdAt).format("DD/MM/YYYY")
      ]);

      autoTableModule.default(doc, {
        startY: 25,
        head: [columns],
        body: rows,
        theme: 'grid',
        styles: { 
          fontSize: 7,
          cellPadding: 1
        },
        headStyles: { 
          fillColor: [128, 0, 128],
          fontSize: 8
        },
        columnStyles: {
          1: {
            font: "Amiri",
            fontStyle: "bold",
            halign: 'right',
            cellWidth: 35,
            direction: 'rtl'
          }
        },
        margin: { left: 10, right: 10 }
      });

      doc.save('investors_report.pdf');
    } catch (error) {
      console.error(error);
      toast.error('فشل في تصدير المساهمين');
    }
  };

  const exportToCSV = async (exportAll = false) => {
    try {
      const xlsxModule = await import('xlsx');
      const response = await Api.get('/api/investors/1');
      const dataToExport = exportAll ? response.data.investors : investorsData.investors.slice(0, rowsPerPage);
      const rows = dataToExport.map(investor => ({  
        ID: investor.userId,
        Name: investor.fullName,
        Amount: formatAmount(investor.amount, 'IQD'),
        SharePercentage: investor.sharePercentage.toFixed(2) + '%',
        Role: investor.role === 'ADMIN' ? 'ادمن' : 'مساهم',
        CreatedAt: dayjs(investor.createdAt).format("DD/MM/YYYY")
      }));
  
      const worksheet = xlsxModule.utils.json_to_sheet(rows);
      const workbook = xlsxModule.utils.book_new();
      xlsxModule.utils.book_append_sheet(workbook, worksheet, 'Investors');
      xlsxModule.writeFile(workbook, 'investors_report.xlsx');
    } catch (error) {
      console.error(error);
      toast.error('فشل في تصدير المساهمين');
    }
  };
  return (
    <>
      <Helmet>
        <title>المساهمين</title>
        <meta name="description" content="المساهمين في نظام إدارة المساهمين" />
      </Helmet>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} mr={3} mt={5} spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setShowAddModal(true)}
            startIcon={<PlusOutlined style={{marginLeft: '10px'}} />}
          >
            اضافة مساهم
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => exportToPDF(true)}
            startIcon={<FilePdfOutlined style={{marginLeft: '10px'}} />}
          >
            تصدير PDF
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => exportToCSV(true)}
            startIcon={<FileExcelOutlined style={{marginLeft: '10px'}} />}
          >
            تصدير CSV
          </Button>
          <Stack direction="row" spacing={1}>
            <InputBase
              placeholder="بحث عن مساهم"
              startAdornment={<SearchOutlined style={{marginLeft: '10px', marginRight: '10px'}} />}
              sx={{
                width: '250px',
                padding: '8px 15px',
                marginLeft: '5px',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              value={searchQuery}
              onChange={handleSearch}
            />
            
            <IconButton 
              onClick={() => setSearchModalOpen(true)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <FilterOutlined />
            </IconButton>
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
                        {formatAmount(investor.amount, 'IQD')}
                      </StyledTableCell>
                      <StyledTableCell align="center">{`${investor.sharePercentage.toFixed(2)}%`}</StyledTableCell>
                      <StyledTableCell align="center">
                        {dayjs(investor.createdAt).format("DD/MM/YYYY")}
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
                      {formatAmount(
                        filteredInvestors.reduce((total, investor) => total + investor.amount, 0),
                        'IQD'
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