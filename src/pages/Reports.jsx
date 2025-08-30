import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Space,
  Spin,
  Alert,
  Grid,
  Layout,
  Statistic,
  Divider
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  UserOutlined,
  DollarOutlined,
  TransactionOutlined,
  RiseOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import apiService from '../services/api';
import { ErrorAlert } from '../components/shared/LoadingComponents';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';
import ReportTypeSelector from '../components/Reports/ReportTypeSelector';
import QuickStats from '../components/Reports/QuickStats';
import ReportFilters from '../components/Reports/ReportFilters';
import ReportPreview from '../components/Reports/ReportPreview';
import IndividualReportModal from '../components/Reports/IndividualReportModal';
import { exportInvestorsSummaryToPDF, exportTransactionsToPDF, exportIndividualInvestorToPDF, exportFinancialYearToPDF, exportToExcel, printIndividualReport } from '../utils/reportExporter';
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { formatAmount, currentCurrency } = useCurrencyManager();
  // eslint-disable-next-line no-unused-vars
  const screens = useBreakpoint();
  
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [individualReportOpen, setIndividualReportOpen] = useState(false);
  const [individualReportLoading, setIndividualReportLoading] = useState(false);
  const [individualReportData, setIndividualReportData] = useState(null);
  const [quickStats, setQuickStats] = useState({
    totalInvestors: 0,
    totalCapital: 0,
    monthlyOperations: 0,
    totalProfits: 0
  });

  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
  const [financialYearReportData, setFinancialYearReportData] = useState(null);
  const [financialYearReportLoading, setFinancialYearReportLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [investorsResponse, transactionsResponse, financialYearsResponse] = await Promise.all([
        apiService.request('/investors?limit=200&includeInactive=true'),
        apiService.request('/transactions?limit=500'),
        apiService.request('/financial-years?limit=10&sort=-startDate')
      ]);
      
      const investorsData = investorsResponse?.data?.investors || [];
      const transactionsData = transactionsResponse?.data?.transactions || [];
      const financialYearsData = financialYearsResponse?.data?.financialYears || [];
            
      setInvestors(Array.isArray(investorsData) ? investorsData : []);
      setFinancialYears(Array.isArray(financialYearsData) ? financialYearsData : []);
      
      const totalCapital = investorsData.reduce((sum, investor) => sum + (investor.amountContributed || 0), 0);
      const totalProfits = financialYearsData.reduce((sum, year) => sum + (year.totalProfit || 0), 0);
      
      setQuickStats({
        totalInvestors: investorsData.length,
        totalCapital: totalCapital,
        monthlyOperations: transactionsData.length,
        totalProfits: totalProfits
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError('فشل في تحميل بيانات التقارير');
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setReportGenerating(true);
      setError(null);
      
      if (selectedReport === "individual_investor") {
        setIndividualReportOpen(true);
        setReportGenerating(false);
        return;
      }

      if (selectedReport === "financial_year") {
        if (!selectedFinancialYear) {
          setError('يرجى اختيار السنة المالية');
          setReportGenerating(false);
          return;
        }

        try {
          setFinancialYearReportLoading(true);
          const [yearResponse, distributionsResponse] = await Promise.all([
            apiService.request(`/financial-years/${selectedFinancialYear._id}`),
            apiService.request(`/financial-years/${selectedFinancialYear._id}/distributions`)
          ]);
          
          const yearData = yearResponse?.data?.financialYear || {};
          const distributions = distributionsResponse?.data?.distributions || [];
          
          setFinancialYearReportData({
            ...yearData,
            distributions: distributions
          });
        } catch (err) {
          console.error('Error loading financial year data:', err);
          setError('فشل في تحميل بيانات السنة المالية');
        } finally {
          setFinancialYearReportLoading(false);
          setReportGenerating(false);
        }
        return;
      }
      
      let reportData = {
        type: selectedReport,
        dateRange: dateRange.length === 2 ? `${dateRange[0].format('YYYY-MM-DD')} - ${dateRange[1].format('YYYY-MM-DD')}` : 'كل الفترات',
        data: []
      };

      switch (selectedReport) {
        case "investors_summary": {
          const investorsResponse = await apiService.request('/investors?limit=200&includeInactive=true');
          const investorsData = investorsResponse?.data?.investors || [];
          reportData.data = investorsData.map(investor => ({
            id: investor._id,
            name: investor.fullName,
            nationalId: investor.nationalId,
            totalInvestment: investor.amountContributed || 0,
            sharePercentage: parseFloat((investor.sharePercentage || 0).toFixed(2)),
          }));
          break;
        }
          
        case "financial_transactions": {
          if (dateRange.length !== 2) {
            setError('يرجى تحديد الفترة الزمنية للعمليات المالية');
            setReportGenerating(false);
            return;
          }
          const transactionsResponse = await apiService.request('/transactions?limit=500');
          const transactionsData = transactionsResponse?.data?.transactions || [];
          reportData.data = transactionsData.map(transaction => ({
            id: transaction._id,
            date: new Date(transaction.transactionDate).toLocaleDateString('en-US'),
            investor: transaction.investorId?.fullName || 'N/A',
            type: transaction.type,
            amount: transaction.amount || 0,
          }));
          break;
        }
          
        default:
          reportData.data = [];
      }
      
      setReportData(reportData);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('فشل في إنشاء التقرير');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleGenerateIndividualReport = async () => {
    if (!selectedInvestor) {
      setError('يرجى اختيار المساهم');
      return;
    }

    try {
      setIndividualReportLoading(true);
      setError(null);

      const [investorResponse, transactionsResponse, financialYearsResponse] = await Promise.all([
        apiService.request(`/investors/${selectedInvestor._id}`),
        apiService.request(`/transactions?investorId=${selectedInvestor._id}`),
        apiService.request('/financial-years')
      ]);

      const investorData = investorResponse?.data?.investor || investorResponse?.data || {};
      const transactionsData = transactionsResponse?.data?.transactions || transactionsResponse?.data || [];
      const financialYears = financialYearsResponse?.data?.financialYears || [];

      const profitsPromises = financialYears.map(year => 
        apiService.request(`/financial-years/${year._id}/distributions`)
          .then(response => {
            const distributions = response?.data?.distributions || [];
            const investorDistribution = distributions.find(d => 
              d.investorId?._id === selectedInvestor._id || 
              d.investorId === selectedInvestor._id
            );
            
            if (investorDistribution) {
              return {
                year: year,
                investmentAmount: investorDistribution.calculation?.investmentAmount || 0,
                totalDays: year.totalDays || 0,
                calculatedProfit: investorDistribution.calculation?.calculatedProfit || 0,
                currency: investorDistribution.currency || year.currency || 'IQD',
                status: investorDistribution.status || 'calculated'
              };
            }
            return null;
          })
          .catch(() => null)
      );

      const profitsResults = await Promise.all(profitsPromises);
      const profitsData = profitsResults.filter(Boolean);

      setIndividualReportData({
        investor: investorData,
        transactions: Array.isArray(transactionsData) ? transactionsData : [],
        profits: profitsData,
        generated: new Date().toLocaleString('ar-SA')
      });

    } catch (err) {
      console.error('Error generating individual report:', err);
      setError('فشل في إنشاء تقرير المساهم');
    } finally {
      setIndividualReportLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData && !financialYearReportData && !individualReportData) {
      setError('يرجى إنشاء التقرير أولاً');
      return;
    }
    
    try {
      if (selectedReport === "individual_investor" && individualReportData) {
        exportIndividualInvestorToPDF(individualReportData);
      } else if (selectedReport === "financial_year" && financialYearReportData) {
        exportFinancialYearToPDF(financialYearReportData);
      } else if (reportData) {
        switch (selectedReport) {
          case 'investors_summary':
            exportInvestorsSummaryToPDF(reportData.data);
            break;
          case 'financial_transactions':
            exportTransactionsToPDF(reportData.data);
            break;
          default:
            setError('نوع التقرير غير مدعوم للتصدير');
        }
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('فشل في تحميل ملف PDF');
    }
  };
  
  const handleDownloadExcel = () => {
    if (!reportData && !financialYearReportData && !individualReportData) {
      setError('يرجى إنشاء التقرير أولاً');
      return;
    }
    
    try {
      if (selectedReport === "financial_year" && financialYearReportData) {
        exportToExcel(financialYearReportData, 'financial_year');
      } else if (selectedReport === "individual_investor" && individualReportData) {
        exportToExcel(individualReportData, 'individual_investor');
      } else if (reportData) {
        exportToExcel(reportData.data, selectedReport);
      }
    } catch (err) {
      console.error('Error downloading Excel:', err);
      setError('فشل في تحميل ملف Excel');
    }
  };
  
  const handlePrintReport = () => {
    if (!reportData && !individualReportData) {
      setError('يرجى إنشاء التقرير أولاً');
      return;
    }

    const generatePrintableReport = () => {
      if (selectedReport === "individual_investor" && individualReportData) {
        return individualReportData;
      }
      return reportData;
    };

    try {
      if (selectedReport === "individual_investor" && individualReportData) {
        printIndividualReport(individualReportData);
      } else {
        // Handle other report types if needed
        const printWindow = window.open('', '_blank');
        const reportContent = generatePrintableReport();
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>طباعة التقرير</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: white;
                color: black;
                padding: 40px;
                line-height: 1.6;
                direction: rtl;
              }
              
              .report-header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #28a745;
                padding-bottom: 20px;
              }
              
              .report-title {
                font-size: 28px;
                font-weight: bold;
                color: #28a745;
                margin-bottom: 10px;
              }
              
              .report-subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 10px;
              }
              
              .report-date {
                font-size: 14px;
                color: #888;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: center;
                font-size: 14px;
              }
              
              th {
                background-color: #28a745;
                color: white;
                font-weight: bold;
              }
              
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin: 30px 0;
              }
              
              .stat-card {
                border: 2px solid #28a745;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                background: #f8f9fa;
              }
              
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #28a745;
                margin-bottom: 5px;
              }
              
              .stat-label {
                font-size: 14px;
                color: #666;
              }
              
              .chip {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: bold;
              }
              
              .chip-success {
                background-color: #d4edda;
                color: #155724;
              }
              
              .chip-warning {
                background-color: #fff3cd;
                color: #856404;
              }
              
              .chip-default {
                background-color: #e2e3e5;
                color: #383d41;
              }
              
              @media print {
                body {
                  padding: 20px;
                }
                
                .report-header {
                  margin-bottom: 20px;
                }
                
                table {
                  font-size: 12px;
                }
                
                th, td {
                  padding: 8px;
                }
              }
            </style>
          </head>
          <body>
            ${reportContent}
          </body>
          </html>
        `);
        
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      console.error('Error printing report:', err);
      setError('فشل في طباعة التقرير');
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
    return <ErrorAlert error={error} onRetry={loadInitialData} />;
  }

  return (
    <>
      <Helmet>
        <title>التقارير والإحصائيات</title>
        <meta name="description" content="التقارير والإحصائيات في نظام إدارة المساهمين" />
      </Helmet>
      <Content style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>التقارير والإحصائيات</Title>
          <Text type="secondary">قم باختيار نوع التقرير وتحديد الفترة الزمنية للحصول على تقارير مفصلة وإحصائيات دقيقة</Text>
        </div>

        <QuickStats 
          quickStats={quickStats} 
          currentCurrency={currentCurrency} 
          formatAmount={formatAmount} 
        />

        <ReportTypeSelector 
          selectedReport={selectedReport}
          setSelectedReport={setSelectedReport}
        />

        <ReportFilters
          selectedReport={selectedReport}
          dateRange={dateRange}
          setDateRange={setDateRange}
          investors={investors}
          selectedInvestor={selectedInvestor}
          setSelectedInvestor={setSelectedInvestor}
          financialYears={financialYears}
          selectedFinancialYear={selectedFinancialYear}
          setSelectedFinancialYear={setSelectedFinancialYear}
          reportGenerating={reportGenerating}
          financialYearReportLoading={financialYearReportLoading}
          handleGenerateReport={handleGenerateReport}
          handleGenerateIndividualReport={handleGenerateIndividualReport}
          setIndividualReportOpen={setIndividualReportOpen}
        />

        {(reportData || financialYearReportData) && (
          <ReportPreview
            selectedReport={selectedReport}
            reportData={reportData}
            financialYearReportData={financialYearReportData}
            currentCurrency={currentCurrency}
            formatAmount={formatAmount}
            handleDownloadPDF={handleDownloadPDF}
            handleDownloadExcel={handleDownloadExcel}
            handlePrintReport={handlePrintReport}
          />
        )}

        <IndividualReportModal
          individualReportOpen={individualReportOpen}
          setIndividualReportOpen={setIndividualReportOpen}
          selectedInvestor={selectedInvestor}
          individualReportData={individualReportData}
          individualReportLoading={individualReportLoading}
          currentCurrency={currentCurrency}
          formatAmount={formatAmount}
          handleDownloadPDF={handleDownloadPDF}
          handleDownloadExcel={handleDownloadExcel}
          handlePrintReport={handlePrintReport}
        />
      </Content>
    </>
  );
};

export default Reports;