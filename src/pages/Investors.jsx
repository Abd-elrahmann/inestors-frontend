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
  useMediaQuery,
  Tooltip
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { QuestionMark, CloudUpload } from "@mui/icons-material";
import { Spin } from "antd";
import AddInvestorModal from "../modals/AddInvestorModal";
import { RestartAltOutlined } from "@mui/icons-material";
import { StyledTableCell, StyledTableRow } from "../styles/TableLayout";
import Api from "../services/api";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "react-query";
import DeleteModal from "../modals/DeleteModal";
import InvestorSearchModal from "../modals/InvestorSearchModal";
import { Link } from "react-router-dom";
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';
import { useSettings } from "../hooks/useSettings";

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
  const [importLoading, setImportLoading] = useState(false);
  const { data: settings } = useSettings();
  const isMobile = useMediaQuery('(max-width: 480px)');

  // Fetch investors query
  const {
    data: investorsData,
    isLoading,
    isFetching,
  } = useQuery(
    ["investors", page, rowsPerPage, searchQuery, advancedFilters, settings?.USDtoIQD],
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
        toast.success("تم حذف المستثمر بنجاح");
      },
      onError: (error) => {
        console.error("Error deleting investor:", error);
        toast.error("فشل في حذف المستثمر");
      },
    }
  );

  const handleAddSuccess = () => {
    queryClient.invalidateQueries("investors");
    setShowAddModal(false);
    setSelectedInvestor(null); 
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

  const handleAddInvestor = () => {
    setSelectedInvestor(null); 
    setShowAddModal(true);
  };

  const handleOpenDeleteModal = (investor) => {
    setSelectedInvestor(investor);
    setShowDeleteModal(true);
  };

  const handleDeleteInvestor = async (investor) => {
    deleteInvestorMutation.mutate(investor.id);
    setShowDeleteModal(false);
    setSelectedInvestor(null); 
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

  const handleDownloadTemplate = () => {
    const template = [
      ['الاسم الكامل', 'رقم الهاتف', 'المبلغ', 'تاريخ الانضمام'],
      ['محمد احمد', '07700000000', '1000000', '2023-01-01']
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(template);

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const phoneCol = 1; 
    const dateCol = 3; 

    
    for(let R = range.s.r + 1; R <= range.e.r; ++R) {
      const phoneCell = XLSX.utils.encode_cell({r: R, c: phoneCol});
      if(!worksheet[phoneCell]) continue;
      worksheet[phoneCell].t = 's'; 
      worksheet[phoneCell].z = '@'; 
    }

    
    for(let R = range.s.r + 1; R <= range.e.r; ++R) {
      const dateCell = XLSX.utils.encode_cell({r: R, c: dateCol});
      if(!worksheet[dateCell]) continue;
      worksheet[dateCell].t = 'd'; 
      worksheet[dateCell].z = 'yyyy-mm-dd'; 
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'investors_template.xlsx';
    link.click();
  };

  const handleImportInvestors = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error('يرجى اختيار ملف Excel صالح (.xlsx or .xls)');
      return;
    }

    setImportLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await Api.post('/api/investors/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`تم استيراد ${response.data.importedCount || 0} مستثمر بنجاح`);
      queryClient.invalidateQueries("investors");
      
    } catch (error) {
      console.error('Error importing investors:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'فشل في استيراد الملف';
      toast.error(errorMessage);
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  const filteredInvestors = investorsData?.investors || [];

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

  return (
    <>
      <Helmet>
        <title>المستثمرين</title>
        <meta name="description" content="المستثمرين في نظام إدارة المستثمرين" />
      </Helmet>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        mt={5}
        spacing={2}
      >
        <Stack direction="row" spacing={1}>
          <Fab
            color="primary"
            variant="extended"
            onClick={handleAddInvestor}
            sx={{
              width: isMobile ? '100%' : '150px',
              borderRadius: '8px',
              fontWeight: 'bold',
              textTransform: 'none',
              height: '40px',
              order: isMobile ? 1 : 0
            }}
          >
            <PlusOutlined style={{ marginLeft: 8 }} />
            إضافة مستثمر
          </Fab>

          <Tooltip title="تحميل نموذج المستثمرين">
            <IconButton onClick={handleDownloadTemplate}>
              <QuestionMark style={{marginRight: '10px'}} />
            </IconButton>
          </Tooltip>

          <Tooltip title="استيراد مستثمرين من Excel">
            <IconButton 
              component="label" 
              disabled={importLoading}
              sx={{ 
                color: importLoading ? 'grey' : 'primary.main',
              }}
            >
              <CloudUpload style={{marginRight: '10px'}} />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportInvestors}
                style={{ display: 'none' }}
              />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          spacing={1}
          sx={{
            order: isMobile ? 0 : 1
          }}
        >
          <InputBase
            placeholder="بحث عن مستثمر"
            startAdornment={
              <SearchOutlined
                style={{ marginLeft: "10px", marginRight: "10px" }}
              />
            }
            sx={{
              width: isMobile ? '100%' : '250px',
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

      {importLoading && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2,
          p: 2,
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderRadius: 1,
          border: '1px solid rgba(25, 118, 210, 0.3)'
        }}>
          <Spin size="small" style={{ marginLeft: '10px' }} />
          <span style={{ color: '#1976d2', fontWeight: 500 }}>جاري استيراد المستثمرين...</span>
        </Box>
      )}

      <Box className="content-area">
        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center"> مسلسل المستثمر</StyledTableCell>
                <StyledTableCell align="center">اسم المستثمر</StyledTableCell>
                <StyledTableCell align="center"> الهاتف</StyledTableCell>
                <StyledTableCell align="center">
                   رأس المال ({settings?.defaultCurrency})
                </StyledTableCell>
                <StyledTableCell align="center"> مبلغ التدوير ({settings?.defaultCurrency})</StyledTableCell>
                <StyledTableCell align="center">نسبة المستثمر</StyledTableCell>
                <StyledTableCell align="center">تاريخ الانضمام</StyledTableCell>
                <StyledTableCell align="center">عرض المعاملات</StyledTableCell>
                <StyledTableCell align="center">تعديل</StyledTableCell>
                <StyledTableCell align="center">حذف</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading || isFetching ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={7} align="center">
                    <Spin style={{marginRight:'230px'}} size="large" />
                  </StyledTableCell>
                </StyledTableRow>
              ) : !investorsData?.investors?.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={11} align="center">
                    لا يوجد مستثمرين
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                <>
                  {filteredInvestors.map((investor) => (
                    <StyledTableRow key={investor.id}>
                      <StyledTableCell align="center">
                        {investor.id}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {investor.fullName}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {investor.phone||'-'}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {convertCurrency(investor.amount, 'IQD', settings?.defaultCurrency).toLocaleString('en-US', {
                          minimumFractionDigits: settings?.defaultCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits: settings?.defaultCurrency === 'USD' ? 2 : 0
                        })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {convertCurrency(investor.rollover || 0, 'IQD', settings?.defaultCurrency).toLocaleString('en-US', {
                          minimumFractionDigits: settings?.defaultCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits: settings?.defaultCurrency === 'USD' ? 2 : 0
                        })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                      </StyledTableCell>
                      <StyledTableCell align="center">{`${investor.sharePercentage.toFixed(
                        2
                      )}%`}</StyledTableCell>
                      <StyledTableCell align="center">
                        {investor.createdAt||'-'}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Link to={`/transactions/${investor.id}`}>
                          <IconButton size="small">
                            <EyeOutlined style={{ color: "green" }} />
                          </IconButton>
                        </Link>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setShowAddModal(true);
                          }}
                        >
                          <EditOutlined style={{ color: "blue" }} />
                        </IconButton>
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
                      colSpan={3}
                      align="center"
                      sx={{ fontWeight: "bold" }}
                    >
                      الإجمالي
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ fontWeight: "bold" }}>
                      {convertCurrency(investorsData?.totalAmount || 0, 'IQD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ fontWeight: "bold" }}>
                      {convertCurrency(investorsData?.totalRollover || 0, 'IQD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                    </StyledTableCell>
                    <StyledTableCell colSpan={5} />
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
          investorData={selectedInvestor}
          mode={selectedInvestor ? 'edit' : 'add'}
        />

        <DeleteModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={() => handleDeleteInvestor(selectedInvestor)}
          title="حذف المستثمر"
          message={`هل أنت متأكد من حذف المستثمر؟`}
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
