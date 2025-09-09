import React, { useState, useEffect, useRef } from 'react';
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
  PrinterOutlined,
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
import { useSettings } from '../hooks/useSettings'; 
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const { data: settings } = useSettings();
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
  const [reportType, setReportType] = useState('');
  const [investors, setInvestors] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [_loading, _setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    fetchInvestors();
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    setReportData([]);
    setSelectedInvestor(null);
    setSelectedFinancialYear(null);
    setDateRange([]);
  }, [reportType]);

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
          // Financial year is optional for individual reports
          if (selectedFinancialYear) {
            url = `/api/reports/investors/${selectedInvestor.id}/${selectedFinancialYear.periodName}`;
          } else {
            url = `/api/reports/investors/${selectedInvestor.id}`;
          }
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

  // Print report function
  const printReport = () => {
    if (
      !reportData ||
      (Array.isArray(reportData) && reportData.length === 0) ||
      (typeof reportData === 'object' && Object.keys(reportData).length === 0)
    ) {
      message.warning('لا توجد بيانات للطباعة');
      return;
    }

    const printContent = printRef.current;
    if (!printContent) {
      message.error('فشل في تحضير المحتوى للطباعة');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    // Get report title based on type
    let reportTitle = 'تقرير';
    switch (reportType) {
      case 'investors':
        reportTitle = 'تقرير جميع المستثمرين';
        break;
      case 'individual':
        reportTitle = `تقرير المستثمر - ${reportData.fullName || ''}`;
        if (selectedFinancialYear) {
          reportTitle += ` - السنة المالية: ${selectedFinancialYear.periodName}`;
        }
        break;
      case 'transactions':
        reportTitle = 'تقرير المعاملات';
        break;
      case 'financial-year':
        reportTitle = `تقرير السنة المالية - ${selectedFinancialYear?.periodName || ''}`;
        break;
      default:
        break;
    }

    // Generate HTML content for printing
    const printHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            direction: rtl;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #28a745;
            padding-bottom: 10px;
          }
          .print-title {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
          }
          .print-date {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #28a745;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 10px;
            color: #28a745;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${reportTitle}</div>
          <div class="print-date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
        </div>
        ${printContent.innerHTML}
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
      printWindow.print();
      // printWindow.close(); // Uncomment if you want to automatically close after printing
    };
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
                    الهاتف
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                  مبلغ المساهمة
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    مبلغ التدوير
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    نسبة المساهمة
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    تاريخ الانضمام
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(reportData) && reportData.map((row) => (
                  <StyledTableRow key={row.id}>
                    <StyledTableCell align="center">{row.fullName}</StyledTableCell>
                    <StyledTableCell align="center">{row.phone}</StyledTableCell>
                    <StyledTableCell align="center">{convertCurrency(row.amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                      minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                      maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                    })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                    <StyledTableCell align="center">{convertCurrency(row.rollover_amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                      minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                      maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                    })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                    <StyledTableCell align="center">{row.sharePercentage.toFixed(2) || 0}%</StyledTableCell>
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
                      الهاتف
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.phone}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      مبلغ المساهمة
                    </StyledTableCell>
                    <StyledTableCell align="center">{convertCurrency(reportData.amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                      minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                      maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                    })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      مبلغ التدوير
                    </StyledTableCell>
                    <StyledTableCell align="center">{convertCurrency(reportData.rollover_amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                      minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                      maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                    })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      نسبة المساهمة
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.sharePercentage?.toFixed(2) || 0}%</StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      تاريخ الانضمام
                    </StyledTableCell>
                    <StyledTableCell align="center">{reportData.createdAt}</StyledTableCell>
                  </StyledTableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider orientation="left" dashed>
              المعاملات
            </Divider>
            <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
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
                      مصدر العملية
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      السنة المالية
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      التاريخ
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.transactions || []).map((transaction) => (
                    <StyledTableRow key={transaction.id}>
                      <StyledTableCell align="center">{transaction.type === 'DEPOSIT' ? 'إيداع' : transaction.type === 'WITHDRAWAL' ? 'سحب' : transaction.type === 'ROLLOVER' ? 'تدوير' : 'غير محدد'}</StyledTableCell>
                      <StyledTableCell align="center">{convertCurrency(transaction.amount || 0, transaction.currency || 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                        <StyledTableCell align="center">{transaction.currency || 'USD'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.withdrawSource || 'غير محدد'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.financialYear?.year || 'غير محدد'} {transaction.financialYear?.periodName ? `- ${transaction.financialYear.periodName}` : ''}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.date}</StyledTableCell>
                    </StyledTableRow>
                  ))}
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
                      السنة المالية
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      رأس المال
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      العملة
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      نسبة المساهمة
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      الربح اليومي
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      إجمالي الربح
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      تاريخ التوزيع
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.profitDistributions || []).map((distribution) => (
                    <StyledTableRow key={distribution.financialYear.year}>
                      <StyledTableCell align="center">{`${distribution.financialYear.year} - ${distribution.financialYear.periodName}`}</StyledTableCell>
                      <StyledTableCell align="center">{convertCurrency(distribution.amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.currency || 'USD'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.percentage.toFixed(2) || 0}%</StyledTableCell>
                        <StyledTableCell align="center">{convertCurrency(distribution.dailyProfit || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{convertCurrency(distribution.financialYear.totalRollover || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.financialYear.distributedAt}</StyledTableCell>
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
                    رأس المال
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    العملة
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    مصدر العملية
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                    السنة المالية
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
                      <StyledTableCell align="center">{transaction.type === 'DEPOSIT' ? 'إيداع' : 'سحب'}</StyledTableCell>
                          <StyledTableCell align="center">{convertCurrency(transaction.amount || 0, transaction.currency || 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.currency || 'USD'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.withdrawSource || 'غير محدد'}</StyledTableCell>
                      <StyledTableCell align="center">{transaction.financialYear?.year || 'غير محدد'} {transaction.financialYear?.periodName ? `- ${transaction.financialYear.periodName}` : ''}</StyledTableCell>
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
              <Table stickyHeader>
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
                       مبلغ التوزيع
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {convertCurrency(reportData.totalProfit || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                    </StyledTableCell>
                  </StyledTableRow>
                  <StyledTableRow>
                    <StyledTableCell align="center" sx={{ fontWeight: 'bold' }}>
                      الحالة
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {reportData.status === 'PENDING'
                        ? 'قيد التوزيع'
                        : reportData.status === 'DISTRIBUTED'
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
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      المستثمر
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                            رأس المال
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      الربح
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      تاريخ الانضمام
                    </StyledTableCell>
                    <StyledTableCell align="center" sx={{ backgroundColor: '#28a745', color: 'white', fontWeight: 'bold' }}>
                      تاريخ التوزيع
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.profitDistributions || []).map((distribution, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell align="center">{distribution.investors?.fullName || 'غير معروف'}</StyledTableCell>
                      <StyledTableCell align="center">
                        {convertCurrency(distribution.amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                          minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                        })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                          {convertCurrency(distribution.investors?.amount || 0, 'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                          minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                        })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {distribution.investors?.createdAt ? distribution.investors.createdAt : 'غير محدد'}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {reportData.distributedAt ? reportData.distributedAt : 'غير محدد'}
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
      padding: 4,
      height: '80%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    });

    const iconStyle = { fontSize: 30, color: '#28a745', marginBottom: 16 };

    return (
      <Row gutter={[24, 24]} justify="center" style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            style={cardStyle(reportType === 'investors')}
            onClick={() => setReportType('investors')}
            bordered={false}
          >
            <UsergroupAddOutlined style={iconStyle} />
            <Title level={5}>جميع المستثمرين</Title>
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
            <Title level={5}>مستثمر فردي</Title>
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
            <Title level={5}>تقرير المعاملات</Title>
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
            <Title level={5}>سنة مالية</Title>
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
          marginBottom: 20,
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
        bodyStyle={{ padding: 10 }}
      >
        <Row gutter={[24, 24]} align="middle" justify="center">
          {reportType === 'individual' && (
            <>
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ display: 'flex', marginBottom: 8 }}>
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
                  style={{ display: 'flex', justifyContent: 'center' }}
                  allowClear
                >
                  {investors.map((inv) => (
                    <Option key={inv.id} value={inv.id}>
                      {inv.fullName}
                    </Option>
                  ))}
                </Select>
              </Col>
              
              {/* Add financial year dropdown for individual reports */}
              <Col xs={24} sm={12} md={6}>
                <Text strong style={{ display: 'flex', marginBottom: 8 }}>
                  اختر سنة مالية (اختياري)
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
                  style={{ display: 'flex', justifyContent: 'center' }}
                  allowClear
                >
                  {financialYears.map((fy) => (
                    <Option key={fy.periodName} value={fy.periodName}>
                      {fy.periodName}
                    </Option>
                  ))}
                </Select>
              </Col>
            </>
          )}

          {reportType === 'financial-year' && (
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'flex', marginBottom: 8 }}>
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
                style={{ display: 'flex', justifyContent: 'center' }}
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
            <Col xs={24} sm={16} md={8} style={{display: 'flex', justifyContent: 'center'}}>
              <Text strong style={{ display: 'flex', marginBottom: 8 }}>
                اختر نطاق التاريخ 
              </Text>
              <RangePicker
                style={{ display: 'flex', justifyContent: 'center' }}
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

          <Col xs={24} sm={24} md={reportType === 'individual' ? 6 : (reportType === 'financial-year' ? 6 : 8)}>
            <Space style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
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
                style={{ width: 80 }}
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
                  icon={<PrinterOutlined />}
                  onClick={printReport}
                  style={{
                    color: '#28a745',
                    borderColor: '#28a745',
                  }}
                >
                  طباعة
                </Button>
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
              {/* Add ref for printing */}
              <div ref={printRef}>
                {renderReportPreview()}
              </div>
            </Card>
          </>
        )}
    </div>
  );
};

export default Reports;