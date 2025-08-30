import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Spin } from 'antd';
import { toast } from 'react-toastify';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import AddUserModal from '../modals/AddUserModal';
import EditUserModal from '../modals/EditUserModal';
import { usersAPI, transformers, handleApiError } from '../services/apiHelpers';
import { showDeleteConfirmation, showSuccessAlert } from '../utils/sweetAlert';
import { Helmet } from 'react-helmet-async';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usersAPI.getAll({
        page: page,
        limit: rowsPerPage, 
        search: searchQuery
      });
      
      if (response.data && response.data.users) {
        const transformedUsers = response.data.users.map(transformers.user);
        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
      } else {
        throw new Error('تنسيق البيانات غير صحيح');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    const confirmed = await showDeleteConfirmation(user.fullName, 'المستخدم');
    
    if (confirmed) {
      try {
        await usersAPI.delete(user.id);
        showSuccessAlert(`تم حذف المستخدم "${user.fullName}" بنجاح`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(`خطأ في حذف المستخدم: ${error.message}`);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchUsers();
  };

  const handleEditSuccess = () => {
    fetchUsers();
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  return (
    <>
    <Helmet>
      <title>المستخدمين</title>
      <meta name="description" content="المستخدمين في نظام إدارة المساهمين" />
    </Helmet>
    <Box className="content-area">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} mr={1} mt={2} spacing={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddUser}
          startIcon={<PlusOutlined style={{marginLeft: '10px'}} />}
        >
          إضافة مستخدم
        </Button>
        <Box sx={{ position: 'relative' }}>
          <InputBase
            placeholder="البحث عن مستخدم..."
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
        </Box>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">الاسم الكامل</StyledTableCell>
              <StyledTableCell align="center">اسم المستخدم</StyledTableCell>
              <StyledTableCell align="center">البريد الإلكتروني</StyledTableCell>
              <StyledTableCell align="center">رقم الهوية</StyledTableCell>
              <StyledTableCell align="center">الدور</StyledTableCell>
              <StyledTableCell align="center">تعديل</StyledTableCell>
              <StyledTableCell align="center">حذف</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <StyledTableRow>
                <StyledTableCell colSpan={7} align="center">
                  <Spin size="large" />
                </StyledTableCell>
              </StyledTableRow>
            ) : !filteredUsers || filteredUsers.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={7} align="center">
                  لا يوجد مستخدمين
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              filteredUsers.slice(0, rowsPerPage).map((user) => (
                <StyledTableRow key={user.id}>
                  <StyledTableCell align="center">{user.fullName}</StyledTableCell>
                  <StyledTableCell align="center">{user.username}</StyledTableCell>
                  <StyledTableCell align="center">{user.email}</StyledTableCell>
                  <StyledTableCell align="center">{user.nationalId}</StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      label={user.role}
                      variant="outlined"
                      sx={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: user.role === 'مدير' ? '#ffc107' : '#6c757d'
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
                      onClick={() => handleDeleteUser(user)}
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
          count={filteredUsers.length}
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
      />

      <EditUserModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        user={selectedUser}
      />
    </Box>
    </>
  );
};

export default Users;