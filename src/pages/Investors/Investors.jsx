import React, { useState, useMemo, useEffect } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { debounce } from "lodash";
import * as XLSX from "xlsx";

// Components
import InvestorsToolbar from "../../components/Investors/InvestorsToolbar";
import InvestorsTable from "../../components/Investors/InvestorsTable";
import AddInvestorModal from "../../modals/AddInvestorModal";
import DeleteModal from "../../modals/DeleteModal";
import InvestorSearchModal from "../../modals/InvestorSearchModal";

// API
import { investorsApi } from "./investorsApi";
import { useSettings } from "../../hooks/useSettings";

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
    setPage(1);
  };

  // React Query
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

      const response = await investorsApi.getInvestors(page, params);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    }
  );

  // Mutations
  const deleteInvestorsMutation = useMutation(investorsApi.deleteInvestors, {
    onSuccess: () => {
      queryClient.invalidateQueries("investors");
      toast.success("تم حذف المستثمرين بنجاح");
      setSelectedIds([]);
    },
    onError: (error) => {
      console.error("Error deleting investors:", error);
      toast.error(error.message || 'فشل في حذف المستثمرين');
    },
  });

  const deleteInvestorMutation = useMutation(investorsApi.deleteInvestor, {
    onSuccess: () => {
      queryClient.invalidateQueries("investors");
      toast.success("تم حذف المستثمر بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting investor:", error);
      toast.error(error.message || 'فشل في حذف المستثمر');
    },
  });

  // Event Handlers
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

  const handleEditInvestor = (investor) => {
    setSelectedInvestor(investor);
    setShowAddModal(true);
  };

  const handleOpenDeleteModal = (investor) => {
    setSelectedInvestor(investor);
    setShowDeleteModal(true);
  };

  const handleDeleteInvestor = async () => {
    if (selectedIds.length > 0) {
      deleteInvestorsMutation.mutate(selectedIds);
    } else if (selectedInvestor) {
      deleteInvestorMutation.mutate(selectedInvestor.id);
    }
    setShowDeleteModal(false);
    setSelectedInvestor(null);
  };

  const handleBulkDelete = () => {
    setShowDeleteModal(true);
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
      debounce((val) => {
        setSearchQuery(val.trim());
        setPage(1);
      }, 100),
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
    setAdvancedFilters({});
    setPage(1);
    setOrderBy("id");
    setOrder("asc");
    localStorage.removeItem('investors_sort_orderBy');
    localStorage.removeItem('investors_sort_order');
    queryClient.invalidateQueries("investors");
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

      const response = await investorsApi.importInvestors(formData);
      toast.success(`تم استيراد ${response.data.importedCount || 0} مستثمر بنجاح`);
      queryClient.invalidateQueries("investors");
      queryClient.invalidateQueries("transactions");
    } catch (error) {
      console.error("Error importing investors:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "فشل في استيراد الملف";
      toast.error(errorMessage);
    } finally {
      setImportLoading(false);
      event.target.value = "";
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelectedIds = investorsData?.investors?.map((investor) => investor.id) || [];
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

  const showResetButton = searchQuery?.trim() || Object.keys(advancedFilters).length > 0;

  return (
    <>
      <Helmet>
        <title>المستثمرين</title>
        <meta name="description" content="المستثمرين في نظام إدارة المستثمرين" />
      </Helmet>

      <InvestorsToolbar
        isMobile={isMobile}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onAddInvestor={handleAddInvestor}
        selectedIds={selectedIds}
        onBulkDelete={handleBulkDelete}
        onDownloadTemplate={handleDownloadTemplate}
        onImportInvestors={handleImportInvestors}
        importLoading={importLoading}
        onOpenSearchModal={() => setSearchModalOpen(true)}
        onResetFilters={handleResetFilters}
        showResetButton={showResetButton}
      />

      <Box className="content-area">
        <InvestorsTable
          investorsData={investorsData}
          isLoading={isLoading}
          isFetching={isFetching}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          orderBy={orderBy}
          order={order}
          onRequestSort={handleRequestSort}
          settings={settings}
          onEditInvestor={handleEditInvestor}
          onDeleteInvestor={handleOpenDeleteModal}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          convertCurrency={convertCurrency}
        />

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
          onConfirm={handleDeleteInvestor}
          title={selectedIds.length > 0 ? "حذف المستثمرين المحددين" : "حذف المستثمر"}
          message={selectedIds.length > 0 ? `هل أنت متأكد من حذف ${selectedIds.length} مستثمرين؟` : "هل أنت متأكد من حذف المستثمر؟"}
          isLoading={deleteInvestorMutation.isLoading || deleteInvestorsMutation.isLoading}
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