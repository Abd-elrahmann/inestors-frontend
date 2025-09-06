import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Divider,
  Spin,
  message,
  Select,
  DatePicker,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  TransactionOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Table, TableBody, TableHead, TableRow, TableContainer, Paper } from '@mui/material';
import {
  exportToExcel,
  exportIndividualInvestorToPDF,
  exportFinancialYearToPDF,
  exportAllInvestorsToPDF,
  exportTransactionsToPDF,
} from '../utils/reportExporter';
import api from '../services/api';
import { StyledTableRow, StyledTableCell } from '../styles/TableLayout';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const { formatAmount } = useCurrencyManager();
  const [reportType, setReportType] = useState('');
  const [investors, setInvestors] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [_loading, _setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchInvestors();
    fetchFinancialYears();
  }, []);

  const fetchInvestors = async () => {
    try {
      const response = await api.get('/api/investors/1');
      setInvestors(response.data?.investors || []);
    } catch (error) {
      console.error('Error fetching investors:', error);
      message.error('فشل في تحميل قائمة المستثمرين');
    }
  };

  const fetchFinancialYears = async () => {
    try {
      const response = await api.get('/api/financial-years/1');
      setFinancialYears(response.data?.years || []);
    } catch (error) {
      console.error('Error fetching financial years:', error);
      message.error('فشل في تحميل قائمة السنوات المالية');
    }
  };

  const generateReport = async () => {
    setPreviewLoading(true);
    try {
      let url = '';
      const params = {};

      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      switch (reportType) {
        case 'investors':
          url = '/api/reports/investors';
          break;
        case 'individual':
          if (!selectedInvestor) {
            message.warning('يرجى اختيار مستثمر');
            setPreviewLoading(false);
            return;
          }
          url = `/api/reports/investors/${selectedInvestor.id}`;
          break;
        case 'transactions':
          url = '/api/reports/transactions';
          break;
        case 'financial-year':
          if (!selectedFinancialYear) {
            message.warning('يرجى اختيار سنة مالية');
            setPreviewLoading(false);
            return;
          }
          url = `/api/reports/financial-years/${encodeURIComponent(selectedFinancialYear.periodName)}`;
          break;
        default:
          break;
      }

      const response = await api.get(url, { params });
      setReportData(response.data || []);
      message.success('تم توليد التقرير بنجاح');
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('فشل في توليد التقرير');
    } finally {
      setPreviewLoading(false);
    }
  };

  const exportReport = (format) => {
    if (
      !reportData ||
      (Array.isArray(reportData) && reportData.length === 0) ||
      (typeof reportData === 'object' && Object.keys(reportData).length === 0)
    ) {
      message.warning('لا توجد بيانات للتصدير');
      return;
    }

    try {
      switch (format) {
        case 'excel':
          exportToExcel(reportData, reportType);
          break;
        case 'pdf':
          if (reportType === 'individual') {
            exportIndividualInvestorToPDF(reportData);
          } else if (reportType === 'financial-year') {
            exportFinancialYearToPDF(reportData);
          } else if (reportType === 'investors') {
            exportAllInvestorsToPDF(reportData);
          } else if (reportType === 'transactions') {
            exportTransactionsToPDF(reportData);
          } else {
            message.warning('التصدير إلى PDF غير متاح لهذا النوع من التقارير');
          }
          break;
        default:
          break;
      }
      message.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('فشل في تصدير التقرير');
    }
  };

  const renderReportPreview = () => {
    if (previewLoading) {
      return (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      );
    }

    if (
      !reportData ||
      (Array.isArray(reportData) && reportData.length === 0) ||
      (typeof reportData === 'object' && Object.keys(reportData).length === 0)
    ) {
      return (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Text>لا توجد بيانات للعرض</Text>
        </div>
      );
    }

    switch (reportType) {
      case 'investors':
        return (
          <TableContainer component={Paper} sx={{ maxHeight: 650, marginTop: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    الاسم
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    البريد الإلكتروني
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    المبلغ
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    تاريخ الإنشاء
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(reportData) && reportData.map((row) => (
                  <StyledTableRow key={row.id}>
                    <StyledTableCell align="center">{row.fullName}</StyledTableCell>
                    <StyledTableCell align="center">{row.email}</StyledTableCell>
                    <StyledTableCell align="center">{formatAmount(row.amount || 0, 'USD')}</StyledTableCell>
                    <StyledTableCell align="center">{row.createdAt}</StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'individual':
        return (
          <div>
            <Divider orientation="left" dashed>
              معلومات المستثمر
            </Divider>
            <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      المعلومة
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      القيمة
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      الاسم
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.fullName}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      البريد الإلكتروني
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.email}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      المبلغ
                    </StyledTableCell>
                    <StyledTableCell align="center">{formatAmount(reportData.amount || 0, 'USD')}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      تاريخ الإنشاء
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.createdAt}</StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider orientation="left" dashed>
              المعاملات
            </Divider>
            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      النوع
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      المبلغ
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      العملة
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      التاريخ
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.transactions || []).map((transaction) => (
                    <StyledTableRow key={transaction.id}>
                      <StyledTableCell align="center">{transaction.type === 'deposit' ? 'إيداع' : 'سحب'}</StyledTableCell>
                      <StyledTableCell align="center">{formatAmount(transaction.amount || 0, transaction.currency || 'USD')}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.currency || 'USD'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.date}</StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        );

      case 'transactions':
        return (
          <TableContainer component={Paper} sx={{ marginTop: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    المستثمر
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    النوع
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    المبلغ
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    العملة
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    التاريخ
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(reportData) &&
                  reportData.map((transaction) => (
                    <StyledTableRow key={transaction.id}>
                      <StyledTableCell align="center">{transaction.investors?.fullName}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.type === 'deposit' ? 'إيداع' : 'سحب'}</StyledTableCell>
                      <StyledTableCell align="center">{formatAmount(transaction.amount || 0, transaction.currency || 'USD')}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.currency || 'USD'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.date}</StyledTableCell>
                    </StyledTableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'financial-year':
        return (
          <div>
            <Divider orientation="left" dashed>
              معلومات السنة المالية
            </Divider>
            <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      المعلومة
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      القيمة
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      السنة
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.year}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      الفترة
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.periodName}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      إجمالي الربح
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {formatAmount(reportData.totalProfit || 0, reportData.currency || 'IQD')}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      الحالة
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {reportData.status === 'calculated'
                        ? 'محسوب'
                        : reportData.status === 'approved'
                        ? 'معتمد'
                        : reportData.status === 'distributed'
                        ? 'موزع'
                        : reportData.status}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      تاريخ البداية
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.startDate}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      تاريخ النهاية
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.endDate}</StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider orientation="left" dashed>
              توزيعات الأرباح
            </Divider>
            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      المستثمر
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      المبلغ
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      التاريخ
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.profitDistributions || []).map((distribution, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell align="center">{distribution.investorId || 'غير معروف'}</StyledTableCell>
                      <StyledTableCell align="center">
                        {formatAmount(distribution.amount || 0, reportData.currency || 'IQD')}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {distribution.distributionDate ? distribution.distributionDate : 'غير محدد'}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        );
      default:
        return null;
    }
  };

  const renderReportOptions = () => {
    const cardStyle = (active) => ({
      textAlign: 'center',
      cursor: 'pointer',
      borderRadius: 12,
      boxShadow: active ? '0 0 10px #28a745' : '0 2px 8px rgba(0,0,0,0.1)',
      border: active ? '2px solid #28a745' : '1px solid #f0f0f0',
      transition: 'all 0.3s ease',
      padding: 24,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    });

    const iconStyle = { fontSize: 40, color: '#28a745', marginBottom: 16 };

    return (
      <Row gutter={[24, 24]} justify="center" style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={cardStyle(reportType === 'investors')}
            onClick={() => setReportType('investors')}
            bordered={false}
          >
            <UsergroupAddOutlined style={iconStyle} />
            <Title level={4}>جميع المستثمرين</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={cardStyle(reportType === 'individual')}
            onClick={() => setReportType('individual')}
            bordered={false}
          >
            <UserOutlined style={iconStyle} />
            <Title level={4}>مستثمر فردي</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={cardStyle(reportType === 'transactions')}
            onClick={() => setReportType('transactions')}
            bordered={false}
          >
            <TransactionOutlined style={iconStyle} />
            <Title level={4}>تقرير المعاملات</Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={cardStyle(reportType === 'financial-year')}
            onClick={() => setReportType('financial-year')}
            bordered={false}
          >
            <CalendarOutlined style={iconStyle} />
            <Title level={4}>سنة مالية</Title>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderReportFilters = () => {
    if (!reportType) return null;

    return (
      <Card
        style={{
          marginBottom: 32,
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 24]} align="middle" justify="center">
          {reportType === 'individual' && (
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                اختر مستثمر
              </Text>
              <Select
                showSearch
                placeholder="اختر مستثمر"
                optionFilterProp="children"
                value={selectedInvestor?.id}
                onChange={(value) => {
                  const investor = investors.find((inv) => inv.id === value);
                  setSelectedInvestor(investor || null);
                }}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                style={{ width: '100%' }}
                allowClear
              >
                {investors.map((inv) => (
                  <Option key={inv.id} value={inv.id}>
                    {inv.fullName}
                  </Option>
                ))}
              </Select>
            </Col>
          )}

          {reportType === 'financial-year' && (
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                اختر سنة مالية
              </Text>
              <Select
                showSearch
                placeholder="اختر سنة مالية"
                optionFilterProp="children"
                value={selectedFinancialYear?.periodName}
                onChange={(value) => {
                  const year = financialYears.find((fy) => fy.periodName === value);
                  setSelectedFinancialYear(year || null);
                }}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                style={{ width: '100%' }}
                allowClear
              >
                {financialYears.map((fy) => (
                  <Option key={fy.periodName} value={fy.periodName}>
                    {fy.periodName}
                  </Option>
                ))}
              </Select>
            </Col>
          )}

          {(reportType === 'investors' || reportType === 'transactions') && (
            <Col xs={24} sm={16} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                اختر نطاق التاريخ
              </Text>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates.length === 2) {
                    setDateRange(dates);
                  } else {
                    setDateRange([]);
                  }
                }}
                placeholder={['تاريخ البداية', 'تاريخ النهاية']}
                allowClear
              />
            </Col>
          )}

          <Col xs={24} sm={24} md={8}>
            <Space style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={generateReport}
                loading={previewLoading}
                style={{
                  backgroundColor: '#28a745',
                  borderColor: '#28a745',
                  width: 140,
                }}
              >
                معاينة التقرير
              </Button>
              <Button
                onClick={() => {
                  setReportType('');
                  setReportData([]);
                  setSelectedInvestor(null);
                  setSelectedFinancialYear(null);
                  setDateRange([]);
                }}
                style={{ width: 100 }}
              >
                إلغاء
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        التقارير
      </Title>

      {renderReportOptions()}
      {renderReportFilters()}

      {reportData &&
        (Array.isArray(reportData) ? reportData.length > 0 : Object.keys(reportData).length > 0) && (
          <>
            <Row justify="end" style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => exportReport('excel')}
                  style={{
                    color: '#28a745',
                    borderColor: '#28a745',
                  }}
                >
                  تصدير لإكسل
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => exportReport('pdf')}
                  style={{
                    color: '#28a745',
                    borderColor: '#28a745',
                  }}
                >
                  تصدير لPDF
                </Button>
              </Space>
            </Row>

            <Card
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}
            >
              {renderReportPreview()}
            </Card>
          </>
        )}
    </div>
  );
};

export default Reports;