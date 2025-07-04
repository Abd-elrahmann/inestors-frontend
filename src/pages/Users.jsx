import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { toast } from 'react-toastify';
import TableComponent from '../components/TableComponent';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import { 
  getStatusCell,
  // eslint-disable-next-line no-unused-vars
  columnWidths 
} from '../styles/tableStyles';
import { usersAPI, transformers, handleApiError } from '../utils/apiHelpers';
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

  // Define table columns with flexible widths
  const columns = [
    {
      field: 'fullName',
      headerName: 'الاسم الكامل',
      flex: 1.5,
      minWidth: 180,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'username',
      headerName: 'اسم المستخدم',
      flex: 1.2,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'email',
      headerName: 'البريد الإلكتروني',
      flex: 2,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'nationalId',
      headerName: 'رقم الهوية',
      flex: 1.2,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'role',
      headerName: 'الدور',
      flex: 0.8,
      minWidth: 100,
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
    {
      field: 'status',
      headerName: 'الحالة',
      flex: 0.8,
      minWidth: 100,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <span style={getStatusCell(params.value, 'نشط')}>
          {params.value}
        </span>
      )
    },
    {
      field: 'lastLogin',
      headerName: 'آخر تسجيل دخول',
      flex: 1.3,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      type: 'date',
      valueGetter: (params) => {
        if (params.value) {
          return new Date(params.value);
        }
        return null;
      }
    },
    {
      field: 'createdAt',
      headerName: 'تاريخ الإنشاء',
      flex: 1.3,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      type: 'date',
      valueGetter: (params) => {
        if (params.value) {
          return new Date(params.value);
        }
        return null;
      },
      valueFormatter: (params) => {
        // Convert to Gregorian date format
        if (params && params.value) {
          const date = new Date(params.value);
          return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        return '';
      }
    }
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
        fetchUsers(); // Refresh the data
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(`خطأ في حذف المستخدم: ${error.message}`);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchUsers(); // Refresh users list
  };

  const handleEditSuccess = () => {
    fetchUsers(); // Refresh users list
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

          {/* Add User Modal */}
          <AddUserModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSuccess={handleAddSuccess}
          />

          {/* Edit User Modal */}
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