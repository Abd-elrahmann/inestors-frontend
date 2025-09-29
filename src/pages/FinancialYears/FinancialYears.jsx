import React, { useState, useMemo, useEffect } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from 'react-query';
import debounce from 'lodash/debounce';

// Components
import FinancialYearsToolbar from '../../components/FinancialYears/FinancialYearsToolbar';
import FinancialYearsTable from '../../components/FinancialYears/FinancialYearsTable';
import AddFinancialYearModal from '../../modals/AddFinancialYearModal';
import ProfitDistributionsModal from '../../modals/ProfitDistributionsModal';
import FinancialSearchModal from '../../modals/FinancialSearchModal';
import EditFinancialYearModal from '../../modals/EditFinancialYear';
import DeleteModal from '../../modals/DeleteModal';

// API
import { financialYearsApi } from './financialYearsApi';
import { useSettings } from '../../hooks/useSettings';

const FinancialYear = () => {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  
  // State
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [distributionModalOpen, setDistributionModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [editFinancialYearModalOpen, setEditFinancialYearModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedYearForMenu, setSelectedYearForMenu] = useState(null);
  const [filters, setFilters] = useState({});

  const isMobile = useMediaQuery('(max-width: 480px)');

  // Sorting state
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');

  // React Query
  const { 
    data: yearsData, 
    isLoading,
    isFetching 
  } = useQuery(
    ['financialYears', page, rowsPerPage, searchTerm, filters, settings?.USDtoIQD, orderBy, order],
    () => financialYearsApi.getFinancialYears(page, {
      limit: rowsPerPage,
      search: searchTerm.trim(),
      sortBy: orderBy,
      sortOrder: order,
      ...filters
    }).then(res => res.data),
    {
      keepPreviousData: true,
      staleTime: 30000
    }
  );

  const { data: distributionsData } = useQuery(
    ['distributions', selectedYear?.id],
    () => financialYearsApi.getDistributions(selectedYear?.id).then(res => res.data),
    {
      enabled: !!selectedYear?.id && distributionModalOpen,
      staleTime: 60000
    }
  );

  useEffect(() => {
    queryClient.invalidateQueries('financialYears');
  }, [settings?.USDtoIQD, queryClient]);

  // Event Handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setSearchTerm(value);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSearchModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleAddFinancialYear = () => {
    setSelectedYear(null);
    setAddModalOpen(true);
  };

  const handleViewDistributions = (year) => {
    setSelectedYear(year);
    setDistributionModalOpen(true);
  };

  const handleEditFinancialYear = (year) => {
    setSelectedYear(year);
    setEditFinancialYearModalOpen(true);
  };

  const handleApproveYear = async (year) => {
    try {
      setSelectedYear(year);
      await financialYearsApi.approveFinancialYear(year.id);
      toast.success('تم الموافقة على السنة المالية بنجاح');
      setAnchorEl(null);
      setSelectedYear(null);
      queryClient.invalidateQueries('financialYears');
      queryClient.invalidateQueries('transactions');
      queryClient.invalidateQueries('investors');
    } catch (error) {
      console.error('Error approving financial year:', error);
      toast.error('فشل في الموافقة على السنة المالية');
    }
  };

  const handleDelete = async (yearId) => {
    try {
      await financialYearsApi.deleteFinancialYear(yearId);
      toast.success('تم حذف السنة المالية بنجاح');
      setShowDeleteModal(false);
      setSelectedYear(null);
      setAnchorEl(null);
      queryClient.invalidateQueries('financialYears');
      queryClient.invalidateQueries('transactions');
    } catch (error) {
      console.error('Error deleting financial year:', error);
      toast.error('فشل في حذف السنة المالية');
    }
  };

  const handleOpenMenu = (event, year) => {
    setAnchorEl(event.currentTarget);
    setSelectedYearForMenu(year);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenDeleteModal = (year) => {
    setSelectedYear(year);
    setShowDeleteModal(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  };

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

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <>
      <Helmet>
        <title>السنوات المالية</title>
      </Helmet>
      
      <Box className="content-area">
        <FinancialYearsToolbar
          isMobile={isMobile}
          onAddFinancialYear={handleAddFinancialYear}
          onSearchChange={handleSearchChange}
          onOpenSearchModal={() => setSearchModalOpen(true)}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <FinancialYearsTable
          yearsData={yearsData}
          isLoading={isLoading}
          isFetching={isFetching}
          orderBy={orderBy}
          order={order}
          onRequestSort={handleRequestSort}
          settings={settings}
          onViewDistributions={handleViewDistributions}
          onEditFinancialYear={handleEditFinancialYear}
          onApproveYear={handleApproveYear}
          onOpenDeleteModal={handleOpenDeleteModal}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          convertCurrency={convertCurrency}
          anchorEl={anchorEl}
          selectedYearForMenu={selectedYearForMenu}
          onOpenMenu={handleOpenMenu}
          onCloseMenu={handleCloseMenu}
        />

        {/* Modals */}
        <AddFinancialYearModal
          open={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            setSelectedYear(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries('financialYears');
            setAddModalOpen(false);
            setSelectedYear(null);
          }}
          financialYear={selectedYear}
          mode={selectedYear ? 'edit' : 'add'}
        />

        <ProfitDistributionsModal
          open={distributionModalOpen}
          onClose={() => {
            setDistributionModalOpen(false);
            setSelectedYear(null);
          }}
          financialYear={selectedYear}
          distributions={distributionsData}
        />

        <FinancialSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={filters}
        />

        <EditFinancialYearModal
          open={editFinancialYearModalOpen}
          onClose={() => {
            setEditFinancialYearModalOpen(false);
            setSelectedYear(null);
          }}
          financialYear={selectedYear}
          onSuccess={() => {
            queryClient.invalidateQueries('financialYears');
            setEditFinancialYearModalOpen(false);
            setSelectedYear(null);
          }}
        />

        <DeleteModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDelete(selectedYear?.id)}
          title="حذف السنة المالية"
          message={`هل أنت متأكد من حذف السنة المالية؟`}
          isLoading={isLoading}
          ButtonText="حذف"
        />
      </Box>
    </>
  );
};

export default FinancialYear;