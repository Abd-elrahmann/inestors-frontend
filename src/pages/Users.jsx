import React, { useState, useMemo } from 'react';
import { debounce } from 'lodash';
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
  Chip,
  InputBase,
  Fab,
  useMediaQuery
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Spin } from 'antd';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import AddUserModal from '../modals/AddUserModal';
import Api from '../services/api';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import DeleteModal from '../modals/DeleteModal';
import UserSearchModal from '../modals/UserSearchModal';
import { RestartAltOutlined } from '@mui/icons-material';

const Users = () => {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const isMobile = useMediaQuery('(max-width: 480px)');

  // Fetch users query
  const { data: usersData, isLoading, isFetching } = useQuery(
    ['users', page, rowsPerPage, search, advancedFilters],
    async () => {
      const params = {
        limit: rowsPerPage,
        search: search,
        role: 'ADMIN',
        ...advancedFilters
      };
      
      const response = await Api.get(`/api/users/${page}`, { params });
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (userId) => Api.delete(`/api/users/${userId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('تم حذف المدير بنجاح');
      },
      onError: (error) => {
        console.error('Error deleting user:', error);
        toast.error('فشل في حذف المدير');
      }
    }
  );

  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setAddModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async (user) => {
    deleteUserMutation.mutate(user.id);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries('users');
    setAddModalOpen(false);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const debouncedSearch = useMemo(() => debounce((val) => {
    setSearch(val);
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

  const fetchUsersQuery = () => {
    queryClient.invalidateQueries("users");
  };

  const filteredUsers = usersData?.users || [];

  return (
    <>
      <Helmet>
        <title>المستخدمين</title>
        <meta name="description" content="المستخدمين في نظام إدارة المساهمين" />
      </Helmet>
      <Box className="content-area">
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" mb={1} mr={1} mt={5} spacing={2}>
        <Fab
          color="primary"
          variant="extended"
          onClick={handleAddUser}
          sx={{
            borderRadius: '8px',
            fontWeight: 'bold',
            textTransform: 'none',
            height: '40px',
          }}
        >
          <PlusOutlined style={{ marginLeft: 8 }} />
          إضافة مدير
        </Fab>

          
          <Stack direction="row" spacing={1}>
            <InputBase
              placeholder="بحث عن مدير"
              startAdornment={<SearchOutlined style={{marginLeft: '10px', marginRight: '10px'}} />}
              sx={{
                width: '250px',
                padding: '8px 15px',
                marginLeft: '5px',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              value={search}
              onChange={handleSearch}
            />
            
            <IconButton 
              onClick={() => setSearchModalOpen(true)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <FilterOutlined style={{color: 'green'}} />
            </IconButton>

            {(search || Object.keys(advancedFilters).length > 0) && (
              <IconButton
                onClick={() => {
                  setSearch('');
                  fetchUsersQuery();
                  setAdvancedFilters({});
                }}
            
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <RestartAltOutlined style={{color: 'blue'}} />
              </IconButton>
            )}
          </Stack>
        </Stack>

        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">المسلسل</StyledTableCell>
                <StyledTableCell align="center">الاسم الكامل</StyledTableCell>
                <StyledTableCell align="center">البريد الإلكتروني</StyledTableCell>
                <StyledTableCell align="center">الدور</StyledTableCell>
                <StyledTableCell align="center">تعديل</StyledTableCell>
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
              ) : !filteredUsers.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={6} align="center">
                    لا يوجد مدراء
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                filteredUsers.map((user) => (
                  <StyledTableRow key={user.id}>
                    <StyledTableCell align="center">{user.id}</StyledTableCell>
                    <StyledTableCell align="center">{user.fullName}</StyledTableCell>
                    <StyledTableCell align="center">{user.email}</StyledTableCell>
                    <StyledTableCell align="center">
                      <Chip
                        label="مدير"
                        variant="outlined"
                        sx={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#ffc107'
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditOutlined />
                      </IconButton>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteModal(user)}
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
            count={usersData?.totalUsers || 0}
            page={page - 1}
            onPageChange={(e, newPage) => setPage(newPage + 1)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 20]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="عدد الصفوف في الصفحة"
          />
        </TableContainer>

        <AddUserModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          user={selectedUser}   
          mode={selectedUser ? 'edit' : 'add'}
        />  

        <DeleteModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={() => handleDeleteUser(selectedUser)}
          title="حذف المدير؟"
          message={`هل أنت متأكد من حذف المدير؟`}  
          isLoading={deleteUserMutation.isLoading}
          ButtonText="حذف"
        />

        <UserSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onSearch={handleAdvancedSearch}
        />
      </Box>
    </>
  );
};

export default Users;