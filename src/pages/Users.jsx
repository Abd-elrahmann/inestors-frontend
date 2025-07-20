import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { toast } from 'react-toastify';
import TableComponent from '../components/shared/TableComponent';
import AddUserModal from '../modals/AddUserModal';
import EditUserModal from '../modals/EditUserModal';
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import { 
  // eslint-disable-next-line no-unused-vars
  columnWidths 
} from '../styles/tableStyles';
import { usersAPI, transformers, handleApiError } from '../services/apiHelpers';
import { showDeleteConfirmation, showSuccessAlert } from '../utils/sweetAlert';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usersAPI.getAll();
      
      if (response.data && response.data.users) {
        const transformedUsers = response.data.users.map(transformers.user);
        setUsers(transformedUsers);
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

  const columns = [
    {
      field: 'fullName',
      headerName: 'الاسم الكامل',
      minWidth: 250,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'username',
      headerName: 'اسم المستخدم',
      minWidth: 180,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'email',
      headerName: 'البريد الإلكتروني',
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'nationalId',
      headerName: 'رقم الهوية',
      minWidth: 160,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'role',
      headerName: 'الدور',
      minWidth: 160,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const getRoleStyle = (role) => {
          if (role === 'مدير') {
            return { 
              backgroundColor: '#ffc107', 
              color: '#212529',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500
            };
          }
          return { 
            backgroundColor: '#6c757d', 
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500
          };
        };
        return (
          <span style={getRoleStyle(params.value)}>
            {params.value}
          </span>
        );
      }
    },
  
  ];

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

  return (
    <Box className="content-area">
      {loading ? (
        <PageLoadingSpinner message="جاري تحميل بيانات المستخدمين..." />
      ) : error ? (
        <ErrorAlert error={error} onRetry={fetchUsers} />
      ) : (
        <>
          <TableComponent
            title="قائمة المستخدمين"
            data={users}
            columns={columns}
            onAdd={handleAddUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            addButtonText="إضافة مستخدم جديد"
            searchPlaceholder="البحث عن مستخدم..."
          />

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
        </>
      )}
    </Box>
  );
};

export default Users; 