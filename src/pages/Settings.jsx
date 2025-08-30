import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Divider,
  Alert,
  Tag,
  Row,
  Col,
  Space,
  Spin,
  InputNumber,
  Statistic,
  Grid,
  Layout,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  DollarOutlined,
  SyncOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { settingsAPI } from '../services/apiHelpers';
import { ErrorAlert } from '../components/shared/LoadingComponents';
import { showSuccessAlert, showDeleteConfirmation } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const formatCurrencySymbol = (currency) => {
  return currency === 'USD' ? '$' : 'د.ع';
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { updateSettings: updateCurrencySettings, refreshPage } = useCurrencyManager();
  // eslint-disable-next-line no-unused-vars
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  
  const [settings, setSettings] = useState({
    defaultCurrency: 'IQD',
    autoConvertCurrency: false,
    displayCurrency: 'IQD',
    exchangeRates: {
      USD_TO_IQD: 0,
      IQD_TO_USD: 0,
    },
    systemName: 'نظام إدارة المساهمين',
    lastRateUpdate: new Date()
  });

  const [tempExchangeRate, setTempExchangeRate] = useState('');
  const [conversionTest, setConversionTest] = useState({
    amount: '',
    fromCurrency: 'USD',
    toCurrency: 'IQD',
    result: null
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await settingsAPI.getSettings();
      
      if (response.data && response.data.settings) {
        setSettings(response.data.settings);
        setTempExchangeRate(response.data.settings.exchangeRates.USD_TO_IQD.toString());
        form.setFieldsValue(response.data.settings);
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
    if (field === 'defaultCurrency') {
      const shouldAutoConvert = value === 'USD';
      setSettings(prev => ({
        ...prev,
        defaultCurrency: value,
        autoConvertCurrency: shouldAutoConvert,
        displayCurrency: value
      }));

      if (shouldAutoConvert) {
        toast.info('تم تفعيل التحويل التلقائي للعملة لضمان عرض جميع المبالغ بالدولار الأمريكي');
      }
    } else if (field === 'displayCurrency') {
      setSettings(prev => ({
        ...prev,
        displayCurrency: value
      }));
    } else if (field === 'autoConvertCurrency' && !value && settings.defaultCurrency === 'USD') {
      toast.warning('لا يمكن إيقاف التحويل التلقائي عندما تكون العملة الافتراضية هي الدولار');
      return;
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        autoConvertCurrency: settings.defaultCurrency === 'USD' ? true : settings.autoConvertCurrency
      };
      
      const currencyUpdateSuccess = await updateCurrencySettings(updatedSettings);
      
      if (currencyUpdateSuccess) {
        const response = await settingsAPI.updateSettings(updatedSettings);
        
        if (response.success) {
          await showSuccessAlert('تم حفظ الإعدادات بنجاح وسيتم تحديث جميع الصفحات');
          refreshPage();
        } else {
          throw new Error(response.message || 'فشل في حفظ الإعدادات');
        }
      } else {
        throw new Error('فشل في تحديث إعدادات العملة');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExchangeRate = async () => {
    try {
      const newRate = parseFloat(tempExchangeRate);
      
      if (!newRate || newRate <= 0) {
        toast.error('يرجى إدخال سعر صرف صحيح (أكبر من صفر)');
        return;
      }

      if (newRate < 1000 || newRate > 2000) {
        const confirmed = await showDeleteConfirmation(
          'تأكيد سعر الصرف',
          'سعر الصرف',
          'سعر الصرف المدخل غير معتاد. هل أنت متأكد من صحة هذا السعر؟'
        );
        if (!confirmed) return;
      }

      setSaving(true);
      
      const updateResponse = await settingsAPI.updateExchangeRates({
        USD_TO_IQD: newRate
      });
      
      if (updateResponse.success) {
        setSettings(prev => ({
          ...prev,
          exchangeRates: {
            USD_TO_IQD: newRate,
            IQD_TO_USD: 1 / newRate
          },
          lastRateUpdate: new Date()
        }));

        await updateCurrencySettings({
          exchangeRates: {
            USD_TO_IQD: newRate,
            IQD_TO_USD: 1 / newRate
          }
        });

        toast.success('تم تحديث سعر الصرف بنجاح');
        refreshPage();
      } else {
        throw new Error(updateResponse.message || 'فشل في تحديث أسعار الصرف');
      }
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث أسعار الصرف');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConversion = async () => {
    try {
      if (!conversionTest.amount || parseFloat(conversionTest.amount) <= 0) {
        toast.error('يرجى إدخال مبلغ صحيح للتحويل');
        return;
      }

      const response = await settingsAPI.convertCurrency({
        amount: parseFloat(conversionTest.amount),
        fromCurrency: conversionTest.fromCurrency,
        toCurrency: conversionTest.toCurrency
      });

      if (response.success && response.data) {
        const { originalAmount, convertedAmount, fromCurrency, toCurrency } = response.data;
        const formattedResult = `${originalAmount.toLocaleString()} ${formatCurrencySymbol(fromCurrency)} = ${convertedAmount.toLocaleString()} ${formatCurrencySymbol(toCurrency)}`;
        
        setConversionTest(prev => ({
          ...prev,
          result: formattedResult
        }));
      } else {
        throw new Error(response.message || 'فشل في تحويل العملة');
      }
    } catch (error) {
      console.error('Error testing conversion:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحويل العملة');
      setConversionTest(prev => ({
        ...prev,
        result: null
      }));
    }
  };

  const handleResetSettings = async () => {
    const confirmed = await showDeleteConfirmation(
      'إعدادات النظام',
      'الإعدادات',
      'هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟'
    );

    if (confirmed) {
      try {
        setSaving(true);
        
        const response = await settingsAPI.resetSettings();
        
        if (response.success) {
          await showSuccessAlert('تم إعادة تعيين الإعدادات بنجاح');
          fetchSettings();
        } else {
          throw new Error(response.message || 'فشل في إعادة تعيين الإعدادات');
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        toast.error(error.message || 'حدث خطأ أثناء إعادة تعيين الإعدادات');
      } finally {
        setSaving(false);
      }
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
      <Content style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>إعدادات النظام</Title>
          <Text type="secondary">إدارة إعدادات العملة والتحويلات في النظام</Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <DollarOutlined />
                  <span>إعدادات العملة</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={settings}
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

                <Form.Item label="عرض العملة" name="displayCurrency">
                  <Select
                    onChange={(value) => handleSettingChange('displayCurrency', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="IQD">دينار عراقي فقط</Option>
                    <Option value="USD">دولار أمريكي فقط</Option>
                    <Option value="BOTH">كلاهما</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="تحويل تلقائي للعملة">
                  <Space>
                    <Switch
                      checked={settings.autoConvertCurrency}
                      onChange={(checked) => handleSettingChange('autoConvertCurrency', checked)}
                      checkedChildren={<CheckOutlined />}
                      unCheckedChildren={<CloseOutlined />}
                    />
                    <Text>تفعيل التحويل التلقائي</Text>
                    <Tooltip title="تحويل جميع المبالغ تلقائياً إلى العملة المحددة">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </Tooltip>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <SyncOutlined />
                  <span>أسعار الصرف</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: '16px' }}>
                <Text strong>الأسعار الحالية:</Text>
                <Space direction="vertical" style={{ width: '100%', marginTop: '8px' }}>
                  <Tag color="green" style={{ margin: '4px 0' }}>
                    1 USD = {settings.exchangeRates.USD_TO_IQD} IQD
                  </Tag>
                  <Tag color="blue" style={{ margin: '4px 0' }}>
                    1 IQD = {settings.exchangeRates.IQD_TO_USD.toFixed(6)} USD
                  </Tag>
                </Space>
              </div>

              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  style={{ width: '100%' }}
                  value={tempExchangeRate}
                  onChange={setTempExchangeRate}
                  placeholder="سعر الدولار بالدينار العراقي"
                  min={0}
                  step={10}
                />
                <Button 
                  type="primary" 
                  onClick={handleUpdateExchangeRate}
                  loading={saving}
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                >
                  {saving ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </Space.Compact>
              <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                أدخل سعر صرف الدولار مقابل الدينار العراقي
              </Text>
            </Card>
          </Col>

          <Col xs={24}>
            <Card 
              title={
                <Space>
                  <SettingOutlined />
                  <span>اختبار تحويل العملة</span>
                </Space>
              }
            >
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={6}>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={conversionTest.amount}
                    onChange={(value) => setConversionTest(prev => ({ ...prev, amount: value }))}
                    placeholder="المبلغ"
                    min={0}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    value={conversionTest.fromCurrency}
                    onChange={(value) => setConversionTest(prev => ({ ...prev, fromCurrency: value }))}
                    style={{ width: '100%' }}
                  >
                    <Option value="USD">USD</Option>
                    <Option value="IQD">IQD</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    value={conversionTest.toCurrency}
                    onChange={(value) => setConversionTest(prev => ({ ...prev, toCurrency: value }))}
                    style={{ width: '100%' }}
                  >
                    <Option value="USD">USD</Option>
                    <Option value="IQD">IQD</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <Button
                    type="primary"
                    onClick={handleTestConversion}
                    style={{ width: '100%', backgroundColor: '#28a745', borderColor: '#28a745' }}
                  >
                    تحويل
                  </Button>
                </Col>
                
                {conversionTest.result && (
                  <Col xs={24}>
                    <Alert 
                      message={`النتيجة: ${conversionTest.result}`}
                      type="info"
                      showIcon
                    />
                  </Col>
                )}
              </Row>
            </Card>
          </Col>

          <Col xs={24}>
            <Card>
              <Row gutter={[16, 16]} justify="center">
                <Col xs={24} sm={12} md={6}>
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
                <Col xs={24} sm={12} md={6}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResetSettings}
                    loading={saving}
                    block
                    size="large"
                    danger
                  >
                    إعادة تعيين
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