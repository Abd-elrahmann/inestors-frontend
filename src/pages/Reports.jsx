import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import {
  MdAssessment as Assessment,
  MdPictureAsPdf as PictureAsPdf,
  MdDownload as Download,
  MdPrint as Print,
  MdTrendingUp as TrendingUp,
  MdPeople as People,
  MdAccountBalance as AccountBalance,
  MdPerson as Person,
  MdTableChart as TableChart,
} from 'react-icons/md';
import apiService from '../utils/api';
import {
  exportInvestorsSummaryToPDF,
  exportTransactionsToPDF,
  exportIndividualInvestorToPDF,
  exportToExcel,
  printIndividualReport
} from '../utils/reportExporter';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // 💰 استخدام مدير العملة المركزي
  const { formatAmount } = useCurrencyManager();
  
  // For individual investor report
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [individualReportOpen, setIndividualReportOpen] = useState(false);
  const [individualReportLoading, setIndividualReportLoading] = useState(false);
  const [individualReportData, setIndividualReportData] = useState(null);
  const [quickStats, setQuickStats] = useState({
    totalInvestors: 0,
    totalCapital: 0,
    totalProfits: 0,
    monthlyOperations: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load investors and transactions for stats and individual reports
      const [investorsResponse, transactionsResponse] = await Promise.all([
        apiService.request('/investors?limit=200&includeInactive=true'),
        apiService.request('/transactions?limit=500')
      ]);
      
      const investorsData = investorsResponse?.data?.investors || [];
      const transactionsData = transactionsResponse?.data?.transactions || [];
      
      setInvestors(Array.isArray(investorsData) ? investorsData : []);
      
      // Calculate quick stats
      const totalCapital = investorsData.reduce((sum, investor) => sum + (investor.amountContributed || 0), 0);
      setQuickStats({
        totalInvestors: investorsData.length,
        totalCapital: totalCapital,
        totalProfits: Math.round(totalCapital * 0.15), // نسبة ربح افتراضية 15%
        monthlyOperations: transactionsData.length
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError('فشل في تحميل بيانات التقارير');
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      id: "investors_summary",
      title: "تقرير المساهمين",
      description: "ملخص شامل لجميع المساهمين ومساهماتهم",
      icon: <People sx={{ fontSize: 40, color: "#28a745" }} />,
    },
    {
      id: "financial_transactions",
      title: "تقرير العمليات المالية",
      description: "تفاصيل جميع العمليات المالية في فترة محددة",
      icon: <AccountBalance sx={{ fontSize: 40, color: "#28a745" }} />,
    },
    {
      id: "performance_analysis",
      title: "تقرير تحليل الأداء",
      description: "تحليل أداء الاستثمارات والعائدات",
      icon: <Assessment sx={{ fontSize: 40, color: "#28a745" }} />,
    },
    {
      id: "individual_investor",
      title: "تقرير مساهم فردي",
      description: "تقرير مفصل لمساهم واحد مع جميع حركاته المالية والأرباح",
      icon: <Person sx={{ fontSize: 40, color: "#28a745" }} />,
    },
  ];

  const handleGenerateReport = async () => {
    try {
      setReportGenerating(true);
      setError(null);
      
      if (selectedReport === "individual_investor") {
        setIndividualReportOpen(true);
        setReportGenerating(false);
        return;
      }
      
      // Generate report based on type
      let reportData = {
        type: selectedReport,
        dateRange: `${dateFrom} - ${dateTo}`,
        generated: new Date().toLocaleString('ar-SA'),
        data: []
      };

      // Get real data from APIs
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
            status: investor.isActive ? 'نشط' : 'غير نشط'
          }));
          break;
        }
          
        case "financial_transactions": {
          const transactionsResponse = await apiService.request('/transactions?limit=500');
          const transactionsData = transactionsResponse?.data?.transactions || [];
          reportData.data = transactionsData.map(transaction => ({
            id: transaction._id,
            date: new Date(transaction.transactionDate).toLocaleDateString('en-CA'),
            investor: transaction.investorId?.fullName || 'غير محدد',
            type: transaction.type === 'deposit' ? 'إيداع' : 'سحب',
            amount: transaction.amount || 0,
            status: 'مؤكد'
          }));
          break;
        }
          
        case "performance_analysis": {
          // Get all data for analysis
          const [analysisInvestors, analysisTransactions, financialYearsResponse] = await Promise.all([
            apiService.request('/investors?limit=200&includeInactive=true'),
            apiService.request('/transactions?limit=500'),
            apiService.request('/financial-years?limit=10&sort=-startDate')  // ترتيب تنازلي حسب تاريخ البداية
          ]);
          
          const allInvestors = analysisInvestors?.data?.investors || [];
          const allTransactions = analysisTransactions?.data?.transactions || [];
          const financialYears = financialYearsResponse?.data?.financialYears || [];
          
          // حساب إجمالي رأس المال
          const totalCapital = allInvestors.reduce((sum, investor) => sum + (investor.amountContributed || 0), 0);
          
          // حساب إجمالي الأرباح من السنوات المالية
          const totalProfits = financialYears.reduce((sum, year) => sum + (year.totalProfit || 0), 0);
          
          // حساب متوسط العائد السنوي (مع التأكد من عدم قسمة على صفر)
          const averageReturn = totalCapital > 0 ? 
            Math.min(((totalProfits / totalCapital) * 100), 999.99).toFixed(2) : "0.00";
          
          // حساب نسبة المساهمين النشطين (مع التأكد من عدم قسمة على صفر)
          const activeInvestors = allInvestors.filter(inv => inv.isActive).length;
          const activeInvestorsPercentage = allInvestors.length > 0 ? 
            Math.min(((activeInvestors / allInvestors.length) * 100), 100).toFixed(1) : "0.0";
          
          // حساب معدل نمو رأس المال - طريقة محسنة
          let capitalGrowth = "0.00";
          let growthDescription = "لا يوجد بيانات كافية";
          
          if (financialYears.length >= 2) {
            const oldestYear = financialYears[financialYears.length - 1];
            const newestYear = financialYears[0];
            
            if (oldestYear && newestYear && oldestYear.totalCapital && oldestYear.totalCapital > 0) {
              const growthRate = ((newestYear.totalCapital - oldestYear.totalCapital) / oldestYear.totalCapital) * 100;
              capitalGrowth = Math.min(Math.max(growthRate, -999.99), 999.99).toFixed(2);
              
              // إضافة وصف للنمو
              const oldDate = new Date(oldestYear.startDate).getFullYear();
              const newDate = new Date(newestYear.startDate).getFullYear();
              growthDescription = `النمو من ${oldDate} إلى ${newDate}`;
            } else {
              growthDescription = "لا يمكن حساب النمو";
            }
          }
          
          // حساب معدل العمليات الشهرية
          const monthlyOperationsAvg = allTransactions.length > 0 ? 
            Math.round(allTransactions.length / 12) : 0;
          
          // حساب نسبة الإيداعات إلى السحوبات
          const deposits = allTransactions.filter(t => t.type === 'deposit').length;
          const withdrawals = allTransactions.filter(t => t.type === 'withdrawal').length;
          const depositToWithdrawalRatio = withdrawals > 0 ? 
            Math.min((deposits / withdrawals).toFixed(2), 99.99) : deposits;
          
          reportData.data = {
            totalInvestors: allInvestors.length,
            activeInvestors: activeInvestors,
            activeInvestorsPercentage: activeInvestorsPercentage,
            totalCapital: totalCapital,
            totalProfits: totalProfits,
            averageReturn: averageReturn,
            capitalGrowth: capitalGrowth,
            growthDescription: growthDescription,
            monthlyOperationsAvg: monthlyOperationsAvg,
            depositToWithdrawalRatio: depositToWithdrawalRatio,
            deposits: deposits,
            withdrawals: withdrawals
          };
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

      // Get investor details, transactions, and profit distributions
      const [investorResponse, transactionsResponse, profitsResponse] = await Promise.all([
        apiService.request(`/investors/${selectedInvestor._id}`),
        apiService.request(`/transactions?investorId=${selectedInvestor._id}`),
        apiService.request(`/investors/${selectedInvestor._id}/profits`)
      ]);

      const investorData = investorResponse?.data?.investor || investorResponse?.data || {};
      const transactionsData = transactionsResponse?.data?.transactions || transactionsResponse?.data || [];
      const profitsData = profitsResponse?.data?.profits || profitsResponse?.data || [];

      setIndividualReportData({
        investor: investorData,
        transactions: Array.isArray(transactionsData) ? transactionsData : [],
        profits: Array.isArray(profitsData) ? profitsData : [],
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
    if (!reportData && !individualReportData) {
      setError('يرجى إنشاء التقرير أولاً');
      return;
    }
    
    try {
      if (selectedReport === "individual_investor" && individualReportData) {
        exportIndividualInvestorToPDF(individualReportData);
      } else if (reportData) {
        const dateRange = reportData.dateRange;
        switch (selectedReport) {
          case 'investors_summary':
            exportInvestorsSummaryToPDF(reportData.data, dateRange);
            break;
          case 'financial_transactions':
            exportTransactionsToPDF(reportData.data, dateRange);
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
    if (!reportData) {
      setError('يرجى إنشاء التقرير أولاً');
      return;
    }
    
    try {
      exportToExcel(reportData.data, selectedReport, reportData.dateRange);
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
    
    try {
      if (selectedReport === "individual_investor" && individualReportData) {
        printIndividualReport(individualReportData);
      } else {
        // إنشاء صفحة طباعة مخصصة
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
        
        // انتظار تحميل المحتوى ثم الطباعة
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      console.error('Error printing report:', err);
      setError('فشل في طباعة التقرير');
    }
  };

  const generatePrintableReport = () => {
    if (!reportData) return '';

    const reportTitle = reportTypes.find(r => r.id === selectedReport)?.title || 'تقرير';
    
    let content = `
      <div class="report-header">
        <div class="report-title">${reportTitle}</div>
        <div class="report-subtitle">الفترة: ${reportData.dateRange}</div>
        <div class="report-date">تم الإنشاء: ${reportData.generated}</div>
      </div>
    `;

    switch (selectedReport) {
      case "investors_summary":
        content += `
          <table>
            <thead>
              <tr>
                <th>اسم المساهم</th>
                <th>الرقم الوطني</th>
                <th>إجمالي الاستثمار</th>
                <th>نسبة المساهمة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(investor => `
                <tr>
                  <td>${investor.name}</td>
                  <td>${investor.nationalId}</td>
                  <td>${formatAmount(investor.totalInvestment, 'IQD')}</td>
                  <td>${investor.sharePercentage}%</td>
                  <td>
                    <span class="chip ${investor.status === 'نشط' ? 'chip-success' : 'chip-default'}">
                      ${investor.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case "financial_transactions":
        content += `
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المساهم</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(transaction => `
                <tr>
                  <td>${transaction.date}</td>
                  <td>${transaction.investor}</td>
                  <td>
                    <span class="chip ${transaction.type === 'إيداع' ? 'chip-success' : 'chip-warning'}">
                      ${transaction.type}
                    </span>
                  </td>
                  <td>${formatAmount(transaction.amount, 'IQD')}</td>
                  <td>
                    <span class="chip chip-success">
                      ${transaction.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case "performance_analysis":
        content += `
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${reportData.data.totalInvestors}</div>
              <div class="stat-label">إجمالي المساهمين</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportData.data.activeInvestorsPercentage}%</div>
              <div class="stat-label">نسبة المساهمين النشطين</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatAmount(reportData.data.totalCapital, 'IQD')}</div>
              <div class="stat-label">إجمالي رأس المال</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportData.data.capitalGrowth !== "0.00" ? `${reportData.data.capitalGrowth}%` : '-'}</div>
              <div class="stat-label">معدل نمو رأس المال</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>المؤشر</th>
                <th>القيمة</th>
                <th>الوصف</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>إجمالي المساهمين</td>
                <td>${reportData.data.totalInvestors}</td>
                <td>العدد الكلي للمساهمين (نشط: ${reportData.data.activeInvestors})</td>
              </tr>
              <tr>
                <td>إجمالي رأس المال</td>
                <td>${formatAmount(reportData.data.totalCapital, 'IQD')}</td>
                <td>مجموع المساهمات الحالية</td>
              </tr>
              <tr>
                <td>إجمالي الأرباح</td>
                <td>${formatAmount(reportData.data.totalProfits, 'IQD')}</td>
                <td>مجموع الأرباح المحققة</td>
              </tr>
              <tr>
                <td>متوسط العائد</td>
                <td>${reportData.data.averageReturn}%</td>
                <td>نسبة الأرباح إلى رأس المال</td>
              </tr>
              <tr>
                <td>معدل نمو رأس المال</td>
                <td>${reportData.data.capitalGrowth !== "0.00" ? `${reportData.data.capitalGrowth}%` : '-'}</td>
                <td>${reportData.data.growthDescription}</td>
              </tr>
              <tr>
                <td>متوسط العمليات الشهرية</td>
                <td>${reportData.data.monthlyOperationsAvg}</td>
                <td>متوسط عدد العمليات في الشهر</td>
              </tr>
              <tr>
                <td>نسبة الإيداعات للسحوبات</td>
                <td>${reportData.data.depositToWithdrawalRatio}</td>
                <td>الإيداعات: ${reportData.data.deposits} | السحوبات: ${reportData.data.withdrawals}</td>
              </tr>
            </tbody>
          </table>
        `;
        break;

      default:
        content += '<p>لا توجد بيانات للعرض</p>';
    }

    return content;
  };

  const renderReportPreview = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case "investors_summary":
        return (
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#28a745' }}>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>اسم المساهم</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>الرقم الوطني</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>إجمالي الاستثمار</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>نسبة المساهمة</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>الحالة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.data.map((investor, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{investor.name}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{investor.nationalId}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{formatAmount(investor.totalInvestment, 'IQD')}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{investor.sharePercentage}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={investor.status} 
                        color={investor.status === 'نشط' ? "success" : "default"} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case "financial_transactions":
        return (
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#28a745' }}>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>التاريخ</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>المساهم</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>النوع</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>المبلغ</TableCell>
                  <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>الحالة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.data.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{transaction.date}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{transaction.investor}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.type} 
                        color={transaction.type === 'إيداع' ? "success" : "warning"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{formatAmount(transaction.amount, 'IQD')}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status} 
                        color={transaction.status === 'مؤكد' ? "success" : "default"} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case "performance_analysis":
        return (
          <Box sx={{ maxWidth: '1200px', margin: '0 auto', px: 2 }}>
            <Grid 
              container 
              spacing={3} 
              justifyContent="center"
              alignItems="stretch"
            >
              <Grid item xs={12} sm={6} md={5} lg={5}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px 0 rgba(40, 167, 69, 0.2)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px 0 rgba(40, 167, 69, 0.3)',
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <People sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.9)' }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reportData.data.activeInvestorsPercentage}%
                  </Typography>
                  <Typography sx={{ fontFamily: "Cairo", fontSize: '1.1rem', opacity: 0.9 }}>
                    نسبة المساهمين النشطين
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                    {reportData.data.activeInvestors} من {reportData.data.totalInvestors} مساهم
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={5} lg={5}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #2196f3 0%, #00bcd4 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px 0 rgba(33, 150, 243, 0.2)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px 0 rgba(33, 150, 243, 0.3)',
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.9)' }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reportData.data.averageReturn}%
                  </Typography>
                  <Typography sx={{ fontFamily: "Cairo", fontSize: '1.1rem', opacity: 0.9 }}>
                    متوسط العائد
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                    {formatAmount(reportData.data.totalProfits, 'IQD')} أرباح إجمالية
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={5} lg={5}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px 0 rgba(255, 152, 0, 0.2)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px 0 rgba(255, 152, 0, 0.3)',
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <AccountBalance sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.9)' }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {formatAmount(reportData.data.totalCapital, 'IQD')}
                  </Typography>
                  <Typography sx={{ fontFamily: "Cairo", fontSize: '1.1rem', opacity: 0.9 }}>
                    إجمالي رأس المال
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                    متوسط المساهمة: {formatAmount(reportData.data.totalCapital / reportData.data.totalInvestors, 'IQD')}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={5} lg={5}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    height: '100%',
                    background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px 0 rgba(103, 58, 183, 0.2)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px 0 rgba(103, 58, 183, 0.3)',
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Assessment sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.9)' }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {reportData.data.capitalGrowth !== "0.00" ? `${reportData.data.capitalGrowth}%` : '-'}
                  </Typography>
                  <Typography sx={{ fontFamily: "Cairo", fontSize: '1.1rem', opacity: 0.9 }}>
                    معدل نمو رأس المال
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                    {reportData.data.growthDescription}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <PageLoadingSpinner message="جاري تحميل بيانات التقارير..." />;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={loadInitialData} />;
  }

  return (
    <Box className="content-area">
      <div className="page-header">
        <h1 className="page-title">التقارير</h1>
        <p className="page-subtitle">إنشاء وتصدير التقارير المختلفة للنظام</p>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 3, fontFamily: "Cairo" }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Report Types */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "Cairo", color: "#28a745", mb: 3 }}
              >
                أنواع التقارير المتاحة
              </Typography>
              <Grid container spacing={2}>
                {reportTypes.map((report) => (
                  <Grid item xs={12} sm={6} key={report.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s",
                        border:
                          selectedReport === report.id
                            ? "2px solid #28a745"
                            : "1px solid #e0e0e0",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
                      }}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <CardContent sx={{ textAlign: "center", p: 3 }}>
                        <Box mb={2}>{report.icon}</Box>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontFamily: "Cairo", fontWeight: 600 }}
                        >
                          {report.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: "Cairo" }}
                        >
                          {report.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Report Preview Area */}
          {selectedReport && (
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontFamily: "Cairo", color: "#28a745", mb: 3 }}
                >
                  معاينة التقرير
                </Typography>
                <Box
                  sx={{
                    minHeight: 400,
                    border: "2px dashed #e0e0e0",
                    backgroundColor: "#f8f9fa",
                    p: 3,
                  }}
                >
                    {reportGenerating ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <CircularProgress size={60} sx={{ color: "#28a745", mb: 2 }} />
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "Cairo", color: "#666" }}
                        >
                          جاري إنشاء التقرير...
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "Cairo", color: "#999" }}
                        >
                          يرجى الانتظار...
                        </Typography>
                    </Box>
                    ) : reportData ? (
                    <Box>
                      <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "Cairo", color: "#28a745", mb: 1 }}
                        >
                          {reportTypes.find(r => r.id === reportData.type)?.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "Cairo", color: "#666" }}
                        >
                          الفترة: {reportData.dateRange} | تم الإنشاء: {reportData.generated}
                        </Typography>
                      </Box>
                      {renderReportPreview()}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                      <Assessment sx={{ fontSize: 60, color: "#28a745", mb: 2 }} />
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "Cairo", color: "#666" }}
                        >
                          معاينة التقرير ستظهر هنا
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "Cairo", color: "#999" }}
                        >
                        اختر نوع التقرير وحدد الفترة الزمنية، ثم اضغط "إنشاء التقرير"
                        </Typography>
                    </Box>
                    )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Report Controls */}
        <Grid 
          container 
          spacing={3} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            maxWidth: '1200px', 
            margin: '0 auto' 
          }}
        >
          <Grid item xs={12} lg={6} >
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontFamily: "Cairo",
                    color: "#28a745",
                    mb: 3,
                    textAlign: "center",
                  }}
                >
                  إعدادات التقرير
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontFamily: "Cairo" }}>
                      نوع التقرير
                    </InputLabel>
                    <Select
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value)}
                      sx={{ fontFamily: "Cairo" }}
                    >
                      {reportTypes.map((report) => (
                        <MenuItem
                          key={report.id}
                          value={report.id}
                          sx={{ fontFamily: "Cairo" }}
                        >
                          {report.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="من تاريخ"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{
                        "& .MuiInputLabel-root": { fontFamily: "Cairo" },
                        "& .MuiInputBase-input": { textAlign: "right" },
                      }}
                    />

                    <TextField
                      label="إلى تاريخ"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{
                        "& .MuiInputLabel-root": { fontFamily: "Cairo" },
                        "& .MuiInputBase-input": { textAlign: "right" },
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleGenerateReport}
                    disabled={!selectedReport || reportGenerating}
                    sx={{
                      backgroundColor: "#28a745",
                      fontFamily: "Cairo",
                      fontWeight: 500,
                      py: 1.5,
                      "&:hover": {
                        backgroundColor: "#218838",
                      },
                    }}
                  >
                    {reportGenerating ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                        جاري الإنشاء...
                      </>
                    ) : (
                      "إنشاء التقرير"
                    )}
                  </Button>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PictureAsPdf />}
                      onClick={handleDownloadPDF}
                      disabled={!selectedReport || (!reportData && !individualReportData) || reportGenerating}
                      sx={{
                        flex: 1,
                        color: "#28a745",
                        borderColor: "#28a745",
                        fontFamily: "Cairo",
                        "&:hover": {
                          backgroundColor: "#28a745",
                          color: "white",
                        },
                      }}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<TableChart />}
                      onClick={handleDownloadExcel}
                      disabled={!selectedReport || !reportData || reportGenerating || selectedReport === "individual_investor"}
                      sx={{
                        flex: 1,
                        color: "#28a745",
                        borderColor: "#28a745",
                        fontFamily: "Cairo",
                        "&:hover": {
                          backgroundColor: "#28a745",
                          color: "white",
                        },
                      }}
                    >
                      Excel
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={handlePrintReport}
                      disabled={!selectedReport || (!reportData && !individualReportData) || reportGenerating}
                      sx={{
                        flex: 1,
                        color: "#28a745",
                        borderColor: "#28a745",
                        fontFamily: "Cairo",
                        "&:hover": {
                          backgroundColor: "#28a745",
                          color: "white",
                        },
                      }}
                    >
                      طباعة
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%",width: "350px" }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontFamily: "Cairo", color: "#28a745", mb: 3, textAlign: "center" }}
                >
                  إحصائيات سريعة
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontFamily: "Cairo" }}>
                      إجمالي المساهمين:
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: "#28a745" }}>
                      {quickStats.totalInvestors}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontFamily: "Cairo" }}>
                      إجمالي رأس المال:
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: "#28a745" }}>
                      {formatAmount(quickStats.totalCapital, 'IQD')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontFamily: "Cairo" }}>
                      الأرباح المحققة:
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: "#28a745" }}>
                      {formatAmount(quickStats.totalProfits, 'IQD')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontFamily: "Cairo" }}>
                      العمليات المسجلة:
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: "#28a745" }}>
                      {quickStats.monthlyOperations}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Individual Investor Report Dialog */}
      <Dialog 
        open={individualReportOpen} 
        onClose={() => setIndividualReportOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontFamily: "Cairo", textAlign: "center" }}>
            تقرير المساهم الفردي
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <Autocomplete
              options={Array.isArray(investors) ? investors : []}
              getOptionLabel={(option) => {
                if (!option) return '';
                const name = option.fullName || option.name || '';
                const nationalId = option.nationalId || '';
                return nationalId ? `${name} - ${nationalId}` : name;
              }}
              value={selectedInvestor}
              onChange={(event, newValue) => setSelectedInvestor(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="اختر المساهم"
                  placeholder={investors.length === 0 ? "لا توجد مساهمين متاحين" : "اختر من القائمة"}
                  sx={{
                    "& .MuiInputLabel-root": { fontFamily: "Cairo" },
                  }}
                />
              )}
              noOptionsText="لا توجد مساهمين متاحين"
            />

            <Button
              variant="contained"
              onClick={handleGenerateIndividualReport}
              disabled={!selectedInvestor || individualReportLoading}
              sx={{
                backgroundColor: "#28a745",
                fontFamily: "Cairo",
                "&:hover": { backgroundColor: "#218838" },
              }}
            >
              {individualReportLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                  جاري إنشاء التقرير...
                </>
              ) : (
                "إنشاء تقرير المساهم"
              )}
            </Button>

            {/* Individual Report Content */}
            {individualReportData && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: "Cairo", mb: 2, color: "#28a745", textAlign: "center" }}>
                  تقرير المساهم: {individualReportData.investor.fullName}
                </Typography>
                
                {/* Investor Info */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontFamily: "Cairo", mb: 2 }}>
                      المعلومات الأساسية
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ fontFamily: "Cairo" }}>
                          <strong>الاسم:</strong> {individualReportData.investor.fullName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ fontFamily: "Cairo" }}>
                          <strong>الرقم الوطني:</strong> {individualReportData.investor.nationalId}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ fontFamily: "Cairo" }}>
                          <strong>مبلغ المساهمة:</strong> {individualReportData.investor.amountContributed?.toLocaleString()} {individualReportData.investor.currency}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ fontFamily: "Cairo" }}>
                          <strong>نسبة المساهمة:</strong> {parseFloat((individualReportData.investor.sharePercentage || 0).toFixed(2))}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Transactions Table */}
                {individualReportData.transactions.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontFamily: "Cairo", mb: 2 }}>
                        الحركات المالية
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#28a745' }}>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>التاريخ</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>النوع</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>المبلغ</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>سنة الأرباح</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>الوصف</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {individualReportData.transactions.map((transaction, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {new Date(transaction.transactionDate).toLocaleDateString('en-CA')}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={
                                      transaction.type === 'deposit' ? 'إيداع' : 
                                      transaction.type === 'withdrawal' ? 'سحب' :
                                      transaction.type === 'profit' ? 'أرباح' : transaction.type
                                    } 
                                    color={
                                      transaction.type === 'deposit' ? "success" : 
                                      transaction.type === 'withdrawal' ? "warning" :
                                      transaction.type === 'profit' ? "primary" : "default"
                                    } 
                                    size="small" 
                                  />
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {transaction.amount.toLocaleString()} {transaction.currency}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {transaction.type === 'profit' && transaction.profitYear ? (
                                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                                      {transaction.profitYear}
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {transaction.description || transaction.notes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Profit Distributions Section */}
                {individualReportData.profits && individualReportData.profits.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontFamily: "Cairo", mb: 2 }}>
                        توزيعات الأرباح
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#28a745' }}>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>السنة المالية</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>مبلغ الاستثمار</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>عدد الأيام</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>الربح المحسوب</TableCell>
                              <TableCell sx={{ fontFamily: "Cairo", color: 'white', fontWeight: 'bold' }}>الحالة</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {individualReportData.profits.map((profit, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: '#28a745' }}>
                                  {profit.profitYear}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {profit.investmentAmount?.toLocaleString() || 0} {profit.currency || 'IQD'}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {profit.totalDays || 0} يوم
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: '#28a745' }}>
                                  {profit.calculatedProfit?.toLocaleString() || 0} {profit.currency || 'IQD'}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={
                                      profit.status === 'calculated' ? 'محسوب' :
                                      profit.status === 'approved' ? 'موافق عليه' :
                                      profit.status === 'distributed' ? 'موزع' : profit.status
                                    } 
                                    color={
                                      profit.status === 'calculated' ? "info" :
                                      profit.status === 'approved' ? "warning" :
                                      profit.status === 'distributed' ? "success" : "default"
                                    } 
                                    size="small" 
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIndividualReportOpen(false)}
            sx={{ fontFamily: "Cairo" }}
          >
            إغلاق
          </Button>
          {individualReportData && (
            <Button 
              onClick={handlePrintReport}
              variant="contained"
              sx={{ 
                fontFamily: "Cairo",
                backgroundColor: "#28a745",
                "&:hover": { backgroundColor: "#218838" }
              }}
            >
              طباعة التقرير
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
