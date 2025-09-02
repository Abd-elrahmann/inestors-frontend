import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Select,
  Button,
  InputNumber,
  Spin,
  Row,
  Col,
  Space,
  Layout,
  Grid
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { ErrorAlert } from '../components/shared/LoadingComponents';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';
import Api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { updateSettings: updateCurrencySettings, refreshPage } = useCurrencyManager();
  // eslint-disable-next-line no-unused-vars
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  
  const [settings, setSettings] = useState({
    defaultCurrency: 'USD',
    USDtoIQD: 0
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await Api.get('/api/settings');
      
      if (response.data) {
        setSettings({
          defaultCurrency: response.data.defaultCurrency,
          USDtoIQD: response.data.USDtoIQD
        });
        form.setFieldsValue({
          defaultCurrency: response.data.defaultCurrency,
          USDtoIQD: response.data.USDtoIQD
        });
      } else {
        throw new Error('تنسيق البيانات غير صحيح');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('خطأ في تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await Api.patch('/api/settings', settings);
      
      // التعديل هنا: التحقق من وجود البيانات في الاستجابة بدلاً من response.success
      if (response.data) {
        await updateCurrencySettings(settings);
        toast.success('تم حفظ الإعدادات بنجاح');
        refreshPage();
      } else {
        throw new Error('فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={fetchSettings} />;
  }

  return (
    <>
      <Helmet>
        <title>الإعدادات</title>
        <meta name="description" content="الإعدادات في نظام إدارة المساهمين" />
      </Helmet>
      <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>إعدادات النظام</Title>
          <Text type="secondary">إدارة إعدادات العملة في النظام</Text>
        </div>

        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={16}>
            <Card 
              title={
                <Space>
                  <DollarOutlined />
                  <span>إعدادات العملة</span>
                </Space>
              }
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={settings}
                style={{ maxWidth: '400px', margin: '0 auto' }}
              >
                <Form.Item label="العملة الافتراضية" name="defaultCurrency">
                  <Select
                    onChange={(value) => handleSettingChange('defaultCurrency', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="IQD">دينار عراقي (د.ع)</Option>
                    <Option value="USD">دولار أمريكي ($)</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="سعر صرف الدولار" name="USDtoIQD">
                  <InputNumber
                    style={{ width: '100%' }}
                    onChange={(value) => handleSettingChange('USDtoIQD', value)}
                    min={0}
                    step={10}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card>
              <Row gutter={[16, 16]} justify="center">
                <Col xs={24} sm={12}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveSettings}
                    loading={saving}
                    block
                    size="large"
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>
    </>
  );
};

export default Settings;