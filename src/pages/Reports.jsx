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
import apiService from '../services/api';
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
  
  const { formatAmount } = useCurrencyManager();
  
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [individualReportOpen, setIndividualReportOpen] = useState(false);
  const [individualReportLoading, setIndividualReportLoading] = useState(false);
  const [individualReportData, setIndividualReportData] = useState(null);
  const [quickStats, setQuickStats] = useState({
    totalInvestors: 0,
    totalCapital: 0,
    monthlyOperations: 0
  });

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
      const financialYears = financialYearsResponse?.data?.financialYears || [];
      
      setInvestors(Array.isArray(investorsData) ? investorsData : []);
      
      const totalCapital = investorsData.reduce((sum, investor) => sum + (investor.amountContributed || 0), 0);
      const totalProfits = financialYears.reduce((sum, year) => sum + (year.totalProfit || 0), 0);
      
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
      
      let reportData = {
        type: selectedReport,
        dateRange: `${dateFrom} - ${dateTo}`,
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
                year: year.year,
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

  const generatePrintableReport = () => {
    if (!reportData) return '';

    const reportTitle = reportTypes.find(r => r.id === selectedReport)?.title || 'تقرير';
    
    let content = `
      <div class="report-header">
        <div class="report-title">${reportTitle}</div>
        <div class="report-subtitle">الفترة: ${reportData.dateRange}</div>
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
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(investor => `
                <tr>
                  <td>${investor.name}</td>
                  <td>${investor.nationalId}</td>
                  <td>${formatAmount(investor.totalInvestment, 'IQD')}</td>
                  <td>${investor.sharePercentage}%</td>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.data.map((investor, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{investor.name}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{investor.nationalId}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{formatAmount(investor.totalInvestment, 'IQD')}</TableCell>
                    <TableCell sx={{ fontFamily: "Cairo" }}>{investor.sharePercentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case "financial_transactions":
        return reportData.data.length === 0 ? null : (
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

      default:
        return null;
    }
  };

  const renderIndividualReport = () => {
  return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
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
                          {individualReportData.profits.length > 0 ? (
                            individualReportData.profits.map((profit, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: '#28a745' }}>
                                  {profit.year}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {formatAmount(profit.investmentAmount, profit.currency)}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo" }}>
                                  {profit.calculatedProfit.totalDays} يوم
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: '#28a745' }}>
                                  {formatAmount(profit.calculatedProfit, profit.currency)}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={
                                      profit.status === 'calculated' ? 'محسوب' :
                                      profit.status === 'approved' ? 'موافق عليه' :
                                      profit.status === 'distributed' ? 'موزع' :
                                      profit.status === 'pending' ? 'قيد الانتظار' : profit.status
                                    } 
                                    color={
                                      profit.status === 'calculated' ? "info" :
                                      profit.status === 'approved' ? "warning" :
                                      profit.status === 'distributed' ? "success" :
                                      profit.status === 'pending' ? "default" : "default"
                                    } 
                                    size="small" 
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} sx={{ textAlign: 'center', fontFamily: "Cairo" }}>
                                لا توجد توزيعات أرباح لهذا المساهم
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
    );
  };

  if (loading) {
    return <PageLoadingSpinner message="جاري تحميل بيانات التقارير..." />;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={loadInitialData} />;
  }

  return (
    <Box sx={{ 
      p: 3,
      maxWidth: '1400px',
      mx: 'auto',
      width: '100%',
    }}>
      {/* Header Section */}
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 2
      }}>
        <Typography variant="h4" sx={{
          fontFamily: 'Cairo',
          fontWeight: 700,
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'center'
        }}>
          <Assessment fontSize="large" sx={{ color: '#28a745' }} />
          التقارير والإحصائيات
        </Typography>
        
        <Typography variant="body1" sx={{ color: '#6c757d', mb: 2 }}>
          قم باختيار نوع التقرير وتحديد الفترة الزمنية للحصول على تقارير مفصلة وإحصائيات دقيقة
        </Typography>
          </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            boxShadow: '0 4px 20px 0 rgba(40, 167, 69, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 4px 25px 0 rgba(40, 167, 69, 0.3)'
            }
          }}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
              minHeight: '200px'
            }}>
              <People sx={{ fontSize: 48 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {quickStats.totalInvestors}
              </Typography>
              <Typography variant="h6" sx={{ textAlign: 'center' }}>إجمالي المساهمين</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)',
            color: 'white',
            boxShadow: '0 4px 20px 0 rgba(33, 150, 243, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 4px 25px 0 rgba(33, 150, 243, 0.3)'
            }
          }}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
              minHeight: '200px'
            }}>
              <AccountBalance sx={{ fontSize: 48 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {formatAmount(quickStats.totalCapital)}
              </Typography>
              <Typography variant="h6" sx={{ textAlign: 'center' }}>إجمالي رأس المال</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
            color: 'white',
            boxShadow: '0 4px 20px 0 rgba(255, 152, 0, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 4px 25px 0 rgba(255, 152, 0, 0.3)'
            }
          }}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
              minHeight: '200px'
            }}>
              <TrendingUp sx={{ fontSize: 48 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {quickStats.monthlyOperations}
              </Typography>
              <Typography variant="h6" sx={{ textAlign: 'center' }}>العمليات الشهرية</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
            color: 'white',
            boxShadow: '0 4px 20px 0 rgba(103, 58, 183, 0.2)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 4px 25px 0 rgba(103, 58, 183, 0.3)'
            }
          }}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
              minHeight: '200px'
            }}>
              <Assessment sx={{ fontSize: 48 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {formatAmount(quickStats.totalProfits)}
              </Typography>
              <Typography variant="h6" sx={{ textAlign: 'center' }}>إجمالي الأرباح</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Selection Section */}
      <Card sx={{ mb: 4, boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2c3e50', textAlign: 'center' }}>
            اختيار التقرير
          </Typography>
          
          <Grid container spacing={3} justifyContent="center">
            {reportTypes.map((report) => (
              <Grid item xs={12} sm={6} md={3} key={report.id}>
                <Card 
                  onClick={() => setSelectedReport(report.id)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: selectedReport === report.id ? '2px solid #28a745' : '1px solid #e0e0e0',
                    boxShadow: selectedReport === report.id ? '0 4px 20px rgba(40, 167, 69, 0.15)' : 'none',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CardContent sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    p: 3,
                    textAlign: 'center'
                  }}>
                    {report.icon}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {report.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Date Range and Controls */}
      {selectedReport && selectedReport !== "individual_investor" && (
        <Card sx={{ mb: 4, boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2c3e50', textAlign: 'center' }}>
              تحديد الفترة الزمنية
            </Typography>
            
            <Grid container spacing={3} alignItems="center" justifyContent="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="من تاريخ"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="إلى تاريخ"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
          <Button 
                  fullWidth
                  variant="contained"
                  onClick={handleGenerateReport}
                  disabled={reportGenerating || !dateFrom || !dateTo}
                  sx={{
                    py: 2,
                    backgroundColor: '#28a745',
                    '&:hover': { backgroundColor: '#218838' }
                  }}
                  startIcon={reportGenerating ? <CircularProgress size={20} color="inherit" /> : <Assessment />}
                >
                  {reportGenerating ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
          </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Individual Investor Selection */}
      {selectedReport === "individual_investor" && (
        <Card sx={{ mb: 4, boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)', width: '100%', mx: 'auto' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2c3e50', textAlign: 'center' }}>
              اختيار المساهم
            </Typography>
            
            <Grid container spacing={3} alignItems="center" justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={investors}
                  getOptionLabel={(option) => option.fullName || ''}
                  value={selectedInvestor}
                  onChange={(event, newValue) => setSelectedInvestor(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="اختر المساهم"
                      fullWidth
                      sx={{ minWidth: '300px' }}
                    />
                  )}
                  sx={{ minWidth: '300px' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
            <Button 
                  fullWidth
              variant="contained"
                  onClick={async () => {
                    await handleGenerateIndividualReport();
                    setIndividualReportOpen(true);
                  }}
                  disabled={!selectedInvestor || individualReportLoading}
              sx={{ 
                    py: 2,
                    backgroundColor: '#28a745',
                    '&:hover': { backgroundColor: '#218838' }
                  }}
                  startIcon={individualReportLoading ? <CircularProgress size={20} color="inherit" /> : <Person />}
                >
                  {individualReportLoading ? 'جاري إنشاء التقرير...' : 'إنشاء تقرير المساهم'}
            </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      {reportData && (
        <Card sx={{ boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)' }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3 
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                معاينة التقرير
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleDownloadPDF}
                  startIcon={<PictureAsPdf />}
                  sx={{ borderColor: '#dc3545', color: '#dc3545' }}
                >
                  تصدير PDF
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleDownloadExcel}
                  startIcon={<Download />}
                  sx={{ borderColor: '#28a745', color: '#28a745' }}
                >
                  تصدير Excel
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handlePrintReport}
                  startIcon={<Print />}
                  sx={{ borderColor: '#007bff', color: '#007bff' }}
                >
                  طباعة
                </Button>
              </Box>
            </Box>
            
            {renderReportPreview()}
          </CardContent>
        </Card>
      )}

      {/* Loading and Error States */}
      {loading && <PageLoadingSpinner />}
      {error && <ErrorAlert message={error} />}

      {/* Individual Report Dialog */}
      {individualReportOpen && (
        <Dialog
          open={individualReportOpen}
          onClose={() => setIndividualReportOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">تقرير المساهم: {selectedInvestor?.fullName}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => handleDownloadPDF('individual')}
                  startIcon={<PictureAsPdf />}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  onClick={() => handlePrintReport('individual')}
                  startIcon={<Print />}
                >
                  طباعة
                </Button>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {individualReportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              individualReportData && renderIndividualReport()
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIndividualReportOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
      )}
    </Box>
  );
};

export default Reports;
