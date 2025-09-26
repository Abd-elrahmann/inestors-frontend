import React, { useState, useMemo, useEffect } from "react";
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
  Tooltip,
  Checkbox,
  TableSortLabel
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
import { debounce } from "lodash";
import * as XLSX from "xlsx";
import { useSettings } from "../hooks/useSettings";

const Investors = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [importLoading, setImportLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { data: settings } = useSettings();
  const isMobile = useMediaQuery("(max-width: 480px)");
  const [selectedIds, setSelectedIds] = useState([]);

  // Sorting state with persistence
  const [orderBy, setOrderBy] = useState(() => {
    const saved = localStorage.getItem('investors_sort_orderBy');
    return saved || "id";
  });
  const [order, setOrder] = useState(() => {
    const saved = localStorage.getItem('investors_sort_order');
    return saved || "asc";
  });

  // Persist sorting state to localStorage
  useEffect(() => {
    localStorage.setItem('investors_sort_orderBy', orderBy);
  }, [orderBy]);

  useEffect(() => {
    localStorage.setItem('investors_sort_order', order);
  }, [order]);

  // Handle sorting request
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(1); // Reset to first page when sorting changes
  };

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  const {
    data: investorsData,
    isLoading,
    isFetching,
  } = useQuery(
    [
      "investors",
      page,
      rowsPerPage,
      searchQuery,
      advancedFilters,
      settings?.USDtoIQD,
      orderBy,
      order,
    ],
    async () => {
      const params = {
        limit: rowsPerPage,
        fullName: searchQuery?.trim() || undefined,
        sortBy: orderBy,
        sortOrder: order,
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
  const totalPages = investorsData?.totalPages || 0;
  const totalInvestors = investorsData?.totalInvestors || 0;

  const deleteInvestorsMutation = useMutation(
    (ids) => Api.delete("/api/investors", { data: { ids } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("investors");
        toast.success("تم حذف المستثمرين بنجاح");
        setSelectedIds([]);
      },
      onError: (error) => {
        console.error("Error deleting investors:", error);
        toast.error("فشل في حذف المستثمرين");
      },
    }
  );

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
    if (selectedIds.length > 0) {
      deleteInvestorsMutation.mutate(selectedIds);
    } else {
      deleteInvestorMutation.mutate(investor.id);
    }
    setShowDeleteModal(false);
    setSelectedInvestor(null);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearchQuery(val.trim());
        setPage(1);
      }, 100),
    []
  );

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
      ["الاسم الكامل", "رقم الهاتف", "المبلغ", "تاريخ الانضمام"],
      ["محمد احمد", "07700000000", "1000000", "2023-01-01"],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(template);

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const phoneCol = 1;
    const dateCol = 3;

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const phoneCell = XLSX.utils.encode_cell({ r: R, c: phoneCol });
      if (!worksheet[phoneCell]) continue;
      worksheet[phoneCell].t = "s";
      worksheet[phoneCell].z = "@";
    }

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const dateCell = XLSX.utils.encode_cell({ r: R, c: dateCol });
      if (!worksheet[dateCell]) continue;
      worksheet[dateCell].t = "d";
      worksheet[dateCell].z = "yyyy-mm-dd";
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "investors_template.xlsx";
    link.click();
  };

  const handleImportInvestors = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("يرجى اختيار ملف Excel صالح (.xlsx or .xls)");
      return;
    }

    setImportLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await Api.post("/api/investors/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        `تم استيراد ${response.data.importedCount || 0} مستثمر بنجاح`
      );
      queryClient.invalidateQueries("investors");
      queryClient.invalidateQueries("transactions");
    } catch (error) {
      console.error("Error importing investors:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "فشل في استيراد الملف";
      toast.error(errorMessage);
    } finally {
      setImportLoading(false);
      event.target.value = "";
    }
  };

  const filteredInvestors = investorsData?.investors || [];

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

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelectedIds = filteredInvestors.map((investor) => investor.id);
      setSelectedIds(newSelectedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (event, id) => {
    if (event.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  return (
    <>
      <Helmet>
        <title>المستثمرين</title>
        <meta
          name="description"
          content="المستثمرين في نظام إدارة المستثمرين"
        />
      </Helmet>
      <Stack
        direction={isMobile ? "column" : "row"}
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
              width: isMobile ? "100%" : "150px",
              borderRadius: "8px",
              fontWeight: "bold",
              textTransform: "none",
              height: "40px",
              order: isMobile ? 1 : 0,
            }}
          >
            <PlusOutlined style={{ marginLeft: 8 }} />
            إضافة مستثمر
          </Fab>

          {selectedIds.length > 0 && (
            <IconButton
              color="error"
              variant="extended"
              onClick={() => setShowDeleteModal(true)}
              sx={{
                width: isMobile ? "100%" : "100px",
                borderRadius: "8px",
                fontWeight: "bold",
                height: "40px",
                fontSize: "14px",
                order: isMobile ? 1 : 0,
              }}
            >
              <DeleteOutlined style={{ marginLeft: 8 }} />({selectedIds.length})
            </IconButton>
          )}

          <Tooltip title="تحميل نموذج المستثمرين">
            <IconButton onClick={handleDownloadTemplate}>
              <QuestionMark style={{ marginRight: "10px" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="استيراد مستثمرين من Excel">
            <IconButton
              component="label"
              disabled={importLoading}
              sx={{
                color: importLoading ? "grey" : "primary.main",
              }}
            >
              <CloudUpload style={{ marginRight: "10px" }} />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportInvestors}
                style={{ display: "none" }}
              />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={1}
          sx={{
            order: isMobile ? 0 : 1,
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
              width: isMobile ? "100%" : "250px",
              borderRadius: "4px",
              fontSize: "16px",
            }}
            value={searchQuery}
            onChange={handleSearch}
          />

          <IconButton
            onClick={() => setSearchModalOpen(true)}
            sx={{
              border: isMobile ? "none" : "1px solid",
              borderColor: isMobile ? "none" : "divider",
            }}
          >
            <FilterOutlined style={{ color: "green" }} />
          </IconButton>

          {(searchQuery?.trim() || Object.keys(advancedFilters).length > 0) && (
            <IconButton
              onClick={() => {
                setSearchQuery("");
                fetchInvestorsQuery();
                setPage(1);
                setAdvancedFilters({});
                setOrderBy("id");
                setOrder("asc");
                // Clear sorting state from localStorage
                localStorage.removeItem('investors_sort_orderBy');
                localStorage.removeItem('investors_sort_order');
              }}
              sx={{
                border: isMobile ? "none" : "1px solid",
                borderColor: isMobile ? "none" : "divider",
              }}
            >
              <RestartAltOutlined style={{ color: "red" }} />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {importLoading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            p: 2,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            borderRadius: 1,
            border: "1px solid rgba(25, 118, 210, 0.3)",
          }}
        >
          <Spin size="small" style={{ marginLeft: "10px" }} />
          <span style={{ color: "#1976d2", fontWeight: 500 }}>
            جاري استيراد المستثمرين...
          </span>
        </Box>
      )}

      <Box className="content-area">
        <TableContainer
          component={Paper}
          sx={{ maxHeight: 650, scrollbarWidth: "none" }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell padding="checkbox">
                  <Checkbox
                    style={{ color: "white" }}
                    checked={
                      selectedIds.length === filteredInvestors.length &&
                      filteredInvestors.length > 0
                    }
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < filteredInvestors.length
                    }
                    onChange={handleSelectAll}
                  />
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "id"}
                    direction={orderBy === "id" ? order : "asc"}
                    onClick={createSortHandler("id")}
                    sx={{ color: "white !important" }}
                  >
                    ت
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "fullName"}
                    direction={orderBy === "fullName" ? order : "asc"}
                    onClick={createSortHandler("fullName")}
                    sx={{ color: "white !important" }}
                  >
                    اسم المستثمر
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap", width: "70px" }}>
                  <TableSortLabel
                    active={orderBy === "phone"}
                    direction={orderBy === "phone" ? order : "asc"}
                    onClick={createSortHandler("phone")}
                    sx={{ color: "white !important" }}
                  >
                    الهاتف
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "amount"}
                    direction={orderBy === "amount" ? order : "asc"}
                    onClick={createSortHandler("amount")}
                    sx={{ color: "white !important" }}
                  >
                    رأس المال ({settings?.defaultCurrency})
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "rollover"}
                    direction={orderBy === "rollover" ? order : "asc"}
                    onClick={createSortHandler("rollover")}
                    sx={{ color: "white !important" }}
                  >
                    مبلغ الربح ({settings?.defaultCurrency})
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "totalAmount"}
                    direction={orderBy === "totalAmount" ? order : "asc"}
                    onClick={createSortHandler("totalAmount")}
                    sx={{ color: "white !important" }}
                  >
                    المجموع ({settings?.defaultCurrency})
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "sharePercentage"}
                    direction={orderBy === "sharePercentage" ? order : "asc"}
                    onClick={createSortHandler("sharePercentage")}
                    sx={{ color: "white !important" }}
                  >
                    نسبة المستثمر
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={orderBy === "createdAt"}
                    direction={orderBy === "createdAt" ? order : "asc"}
                    onClick={createSortHandler("createdAt")}
                    sx={{ color: "white !important" }}
                  >
                    تاريخ الانضمام
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  عرض المعاملات
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  تعديل
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  حذف
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading || isFetching ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={11} align="center">
                    <Spin style={{ marginLeft: "100px" }} size="large" />
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
                      <StyledTableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(investor.id)}
                          onChange={(event) =>
                            handleSelectOne(event, investor.id)
                          }
                        />
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {investor.id}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {investor.fullName}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap", width: "70px" }}
                      >
                        {investor.phone || "-"}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {convertCurrency(
                          investor.amount,
                          "USD",
                          settings?.defaultCurrency
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{" "}
                        {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {convertCurrency(
                          investor.rollover || 0,
                          "USD",
                          settings?.defaultCurrency
                        ).toLocaleString("en-US", {
                          minimumFractionDigits:
                            settings?.defaultCurrency === "USD" ? 2 : 0,
                          maximumFractionDigits:
                            settings?.defaultCurrency === "USD" ? 2 : 0,
                        })}{" "}
                        {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {convertCurrency(
                          investor.totalAmount,
                          "USD",
                          settings?.defaultCurrency
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{" "}
                        {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                      </StyledTableCell>
                      <StyledTableCell align="center">{`${investor.sharePercentage.toFixed(
                        2
                      )}%`}</StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {investor.createdAt || "-"}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        <Link to={`/transactions/${investor.id}`}>
                          <IconButton size="small">
                            <EyeOutlined style={{ color: "green" }} />
                          </IconButton>
                        </Link>
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
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
                      <StyledTableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
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
                      colSpan={4}
                      align="center"
                      sx={{ fontWeight: "bold" }}
                    >
                      الإجمالي
                    </StyledTableCell>
                    <StyledTableCell
                      align="center"
                      sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      {convertCurrency(
                        investorsData?.totalAmount || 0,
                        "USD",
                        settings?.defaultCurrency
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                    </StyledTableCell>
                    <StyledTableCell
                      align="center"
                      sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      {convertCurrency(
                        investorsData?.totalRollover || 0,
                        "USD",
                        settings?.defaultCurrency
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                    </StyledTableCell>
                    <StyledTableCell
                      align="center"
                      sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      {convertCurrency(
                        (investorsData?.totalAmount || 0) +
                          (investorsData?.totalRollover || 0),
                        "USD",
                        settings?.defaultCurrency
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                    </StyledTableCell>
                    <StyledTableCell
                      colSpan={5}
                      sx={{ whiteSpace: "nowrap" }}
                    />
                  </StyledTableRow>
                </>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalInvestors}
            totalPages={totalPages}
            page={page - 1}
            onPageChange={(e, newPage) => {
              setPage(newPage + 1);
            }}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 20]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="عدد الصفوف في الصفحة"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
            }
          />
        </TableContainer>

        <AddInvestorModal
          open={showAddModal}
          onClose={handleCloseModal}
          onSuccess={handleAddSuccess}
          investorData={selectedInvestor}
          mode={selectedInvestor ? "edit" : "add"}
        />

        <DeleteModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={() => handleDeleteInvestor(selectedInvestor)}
          title={
            selectedIds.length > 0 ? "حذف المستثمرين المحددين" : "حذف المستثمر"
          }
          message={
            selectedIds.length > 0
              ? `هل أنت متأكد من حذف ${selectedIds.length} مستثمرين؟`
              : "هل أنت متأكد من حذف المستثمر؟"
          }
          isLoading={
            deleteInvestorMutation.isLoading ||
            deleteInvestorsMutation.isLoading
          }
          ButtonText="حذف"
        />

        <InvestorSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSearch={handleAdvancedSearch}
          fetchInvestors={fetchInvestorsQuery}
        />
      </Box>
    </>
  );
};

export default Investors;