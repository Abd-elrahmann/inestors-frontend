import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Avatar,
  Divider,
  Row,
  Col,
  Space,
  Spin,
  Layout,
  Tag,
  Grid
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  MailOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { authAPI } from '../services/api';
import { Helmet } from 'react-helmet-async';

const { Title, Text } = Typography;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [formData, setFormData] = useState({
    fullName: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const screens = useBreakpoint();
  const [form] = Form.useForm();

  useEffect(() => {
    loadUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    setIsPageLoading(true);
    setErrors({});
    
    try {
      const localUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      if (localUser) {
        try {
          const userData = JSON.parse(localUser);
          setUser(userData);
          setFormData({
            fullName: userData.fullName || '',
            username: userData.username || ''
          });
          form.setFieldsValue({
            fullName: userData.fullName || '',
            username: userData.username || ''
          });
          setIsPageLoading(false);
        } catch (parseError) {
          console.error('Error parsing localStorage user data:', parseError);
          localStorage.removeItem('user');
        }
      }

      try {
        const response = await authAPI.getProfile();
        
        if (response.success && response.data && response.data.user) {
          const apiUser = response.data.user;
          setUser(apiUser);
          setFormData({
            fullName: apiUser.fullName || '',
            username: apiUser.username || ''
          });
          form.setFieldsValue({
            fullName: apiUser.fullName || '',
            username: apiUser.username || ''
          });
          localStorage.setItem('user', JSON.stringify(apiUser));
        } else {
          console.warn('API response format unexpected:', response);
          if (!localUser) {
            setErrors({ submit: 'تنسيق البيانات من الخادم غير صحيح' });
          }
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        if (!localUser) {
          if (apiError.message.includes('Not authorized')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          setErrors({ submit: 'حدث خطأ في تحميل البيانات من الخادم: ' + apiError.message });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setErrors({ submit: 'حدث خطأ غير متوقع في تحميل البيانات' });
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleSave = async (values) => {
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await authAPI.updateProfile({
        fullName: values.fullName.trim(),
        username: values.username.trim()
      });

      if (response.success) {
        const updatedUser = response.data?.user || { ...user, fullName: values.fullName, username: values.username };
        setUser(updatedUser);
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setFormData({
          fullName: updatedUser.fullName || '',
          username: updatedUser.username || ''
        });
        
        setSuccessMessage('تم تحديث البيانات بنجاح!');
        setIsEditing(false);
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ submit: response.message || 'حدث خطأ في تحديث البيانات' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        setErrors({ username: 'اسم المستخدم مستخدم بالفعل' });
        form.setFields([{
          name: 'username',
          errors: ['اسم المستخدم مستخدم بالفعل']
        }]);
      } else {
        setErrors({ submit: error.message || 'حدث خطأ في تحديث البيانات' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {  
    form.setFieldsValue({
      fullName: user?.fullName || '',
      username: user?.username || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  if (isPageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px', 
        gap: '16px' 
      }}>
        <Title level={4} style={{ color: '#ff4d4f' }}>
          فشل في تحميل بيانات المستخدم
        </Title>
        <Text type="secondary" style={{ textAlign: 'center' }}>
          حدث خطأ في تحميل بياناتك الشخصية. يرجى المحاولة مرة أخرى.
        </Text>
        <Button 
          type="primary" 
          onClick={loadUserData}
          style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>الملف الشخصي</title>
        <meta name="description" content="الملف الشخصي في نظام إدارة المساهمين" />
      </Helmet>
      <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Avatar
            size={100}
            style={{ 
              backgroundColor: '#28a745',
              fontSize: '40px',
              marginBottom: '16px'
            }}
            icon={<UserOutlined />}
          />
          <Title level={2} style={{ color: '#28a745', marginBottom: '8px' }}>
            الملف الشخصي
          </Title>
          <Text type="secondary">
            إدارة معلوماتك الشخصية
          </Text>
        </Card>

        {successMessage && (
          <Alert 
            message={successMessage} 
            type="success" 
            showIcon 
            style={{ marginBottom: '24px' }}
          />
        )}

        {errors.submit && (
          <Alert 
            message={errors.submit} 
            type="error" 
            showIcon 
            style={{ marginBottom: '24px' }}
          />
        )}

        <Card
          title="المعلومات الشخصية"
          extra={
            !isEditing ? (
              <Button
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                تعديل
              </Button>
            ) : (
              <Space>
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  onClick={() => form.submit()}
                  loading={isLoading}
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                >
                  حفظ
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
              </Space>
            )
          }
        >
          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              fullName: user.fullName || '',
              username: user.username || ''
            }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="الاسم الكامل"
                  name="fullName"
                  rules={[
                    { required: true, message: 'الاسم الكامل مطلوب' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#28a745' }} />}
                    disabled={!isEditing || isLoading}
                    placeholder="أدخل الاسم الكامل"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="اسم المستخدم"
                  name="username"
                  rules={[
                    { required: true, message: 'اسم المستخدم مطلوب' },
                    { min: 3, message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#28a745' }} />}
                    disabled={!isEditing || isLoading}
                    placeholder="أدخل اسم المستخدم"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item label="البريد الإلكتروني">
                  <Input 
                    value={user.email || 'غير محدد'}
                    disabled
                    prefix={<MailOutlined style={{ color: '#666' }} />}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="الدور الوظيفي">
                  <Input 
                    value={user.role === 'admin' ? 'مدير النظام' : 'مستخدم عادي'}
                    disabled
                    prefix={<SafetyCertificateOutlined style={{ color: '#666' }} />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card title="معلومات إضافية" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IdcardOutlined style={{ color: '#666' }} />
                <Text strong>حالة الحساب: </Text>
                <Tag color="green">نشط</Tag>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SafetyCertificateOutlined style={{ color: '#666' }} />
                <Text strong>تاريخ الإنشاء: </Text>
                <Text>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' }) : 'غير محدد'}</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Content>
    </>
  );
};

export default Profile;