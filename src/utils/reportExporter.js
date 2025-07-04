import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// تصدير تقرير المساهمين إلى PDF
export const exportInvestorsSummaryToPDF = (data, dateRange) => {
  const doc = new jsPDF();
  
  // عنوان التقرير
  doc.setFontSize(18);
  doc.text('Investors Summary Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Period: ${dateRange}`, 105, 30, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
  
  // الجدول
  const headers = [['Name', 'National ID', 'Investment', 'Share %', 'Status']];
  const rows = data.map(investor => [
    investor.name,
    investor.nationalId,
    `${investor.totalInvestment.toLocaleString()} SAR`,
    `${investor.sharePercentage}%`,
    investor.status === 'نشط' ? 'Active' : 'Inactive'
  ]);
  
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 50,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255 }
  });
  
  doc.save('investors-summary-report.pdf');
};

// تصدير تقرير العمليات المالية إلى PDF
export const exportTransactionsToPDF = (data, dateRange) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Financial Transactions Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Period: ${dateRange}`, 105, 30, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
  
  const headers = [['Date', 'Investor', 'Type', 'Amount', 'Status']];
  const rows = data.map(transaction => [
    transaction.date,
    transaction.investor,
    transaction.type,
    `${transaction.amount.toLocaleString()} SAR`,
    transaction.status
  ]);
  
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 50,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255 }
  });
  
  doc.save('financial-transactions-report.pdf');
};

// تصدير تقرير توزيع الأرباح إلى PDF
export const exportProfitDistributionToPDF = (data, dateRange) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Profit Distribution Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Period: ${dateRange}`, 105, 30, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
  
  const headers = [['Investor', 'Investment', 'Days', 'Profit', 'Rate %']];
  const rows = data.map(profit => [
    profit.investor,
    `${profit.investment.toLocaleString()} SAR`,
    profit.days.toString(),
    `${profit.profit.toLocaleString()} SAR`,
    `${profit.profitRate}%`
  ]);
  
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 50,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255 }
  });
  
  doc.save('profit-distribution-report.pdf');
};

// تصدير تقرير المساهم الفردي إلى PDF
export const exportIndividualInvestorToPDF = (reportData) => {
  const doc = new jsPDF();
  const investor = reportData.investor;
  const transactions = reportData.transactions;
  
  // عنوان التقرير
  doc.setFontSize(18);
  doc.text('Individual Investor Report', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Investor: ${investor.fullName}`, 105, 35, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated: ${reportData.generated}`, 105, 45, { align: 'center' });
  
  // معلومات المساهم
  let yPosition = 60;
  doc.setFontSize(14);
  doc.text('Investor Information:', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.text(`Name: ${investor.fullName}`, 30, yPosition);
  yPosition += 7;
  doc.text(`National ID: ${investor.nationalId}`, 30, yPosition);
  yPosition += 7;
  doc.text(`Investment: ${investor.amountContributed?.toLocaleString()} ${investor.currency}`, 30, yPosition);
  yPosition += 7;
  doc.text(`Share: ${investor.sharePercentage}%`, 30, yPosition);
  yPosition += 15;
  
  // إضافة جدول الأرباح إذا كانت موجودة
  if (reportData.profits && reportData.profits.length > 0) {
    doc.setFontSize(14);
    doc.text('Profit Distributions:', 20, yPosition);
    yPosition += 10;
    
    const profitHeaders = [['Year', 'Investment', 'Days', 'Profit', 'Status']];
    const profitRows = reportData.profits.map(profit => [
      profit.profitYear?.toString() || '-',
      `${profit.investmentAmount?.toLocaleString() || '0'} ${profit.currency || 'IQD'}`,
      `${profit.totalDays || 0} days`,
      `${profit.calculatedProfit?.toLocaleString() || '0'} ${profit.currency || 'IQD'}`,
      profit.status === 'calculated' ? 'Calculated' : 
      profit.status === 'approved' ? 'Approved' : 
      profit.status === 'distributed' ? 'Distributed' : profit.status
    ]);
    
    doc.autoTable({
      head: profitHeaders,
      body: profitRows,
      startY: yPosition,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [40, 167, 69], textColor: 255 }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
  }
  
  // جدول الحركات المالية
  if (transactions.length > 0) {
    const headers = [['Date', 'Type', 'Amount', 'Profit Year', 'Description']];
    const rows = transactions.map(transaction => [
      new Date(transaction.transactionDate).toLocaleDateString(),
      transaction.type === 'deposit' ? 'Deposit' : 
      transaction.type === 'withdrawal' ? 'Withdrawal' :
      transaction.type === 'profit' ? 'Profit' : transaction.type,
      `${transaction.amount.toLocaleString()} ${transaction.currency}`,
      transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear.toString() : '-',
      transaction.description || transaction.notes || '-'
    ]);
    
    doc.autoTable({
      head: headers,
      body: rows,
      startY: yPosition,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [40, 167, 69], textColor: 255 }
    });
  }
  
  doc.save(`investor-report-${investor.fullName.replace(/\s+/g, '-')}.pdf`);
};

// تصدير إلى Excel
export const exportToExcel = (data, reportType, dateRange) => {
  let worksheetData = [];
  let filename = '';
  
  switch (reportType) {
    case 'investors_summary':
      filename = 'investors-summary-report.xlsx';
      worksheetData = [
        ['Investor Name', 'National ID', 'Total Investment', 'Share Percentage', 'Status'],
        ...data.map(investor => [
          investor.name,
          investor.nationalId,
          investor.totalInvestment,
          investor.sharePercentage,
          investor.status
        ])
      ];
      break;
      
    case 'financial_transactions':
      filename = 'financial-transactions-report.xlsx';
      worksheetData = [
        ['Date', 'Investor', 'Type', 'Amount', 'Status'],
        ...data.map(transaction => [
          transaction.date,
          transaction.investor,
          transaction.type,
          transaction.amount,
          transaction.status
        ])
      ];
      break;
      
    case 'profit_distribution':
      filename = 'profit-distribution-report.xlsx';
      worksheetData = [
        ['Investor', 'Investment Amount', 'Days', 'Profit Amount', 'Profit Rate'],
        ...data.map(profit => [
          profit.investor,
          profit.investment,
          profit.days,
          profit.profit,
          profit.profitRate
        ])
      ];
      break;
      
    case 'performance_analysis':
      filename = 'performance-analysis-report.xlsx';
      worksheetData = [
        ['Metric', 'Value'],
        ['Total Investors', data.totalInvestors],
        ['Total Capital', data.totalCapital],
        ['Total Profits', data.totalProfits],
        ['Average Return', data.averageReturn],
        ['Monthly Operations', data.monthlyOperations],
        ['Success Rate', data.successRate]
      ];
      break;
      
    default:
      filename = 'report.xlsx';
  }
  
  // إنشاء workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  // حفظ الملف
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

// طباعة تقرير المساهم الفردي
export const printIndividualReport = (reportData) => {
  const investor = reportData.investor;
  const transactions = reportData.transactions;
  
  const printWindow = window.open('', '_blank');
  
  const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير المساهم - ${investor.fullName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #28a745; padding-bottom: 20px; }
        .header h1 { color: #28a745; margin: 0; }
        .info-section { background-color: #f8f9fa; padding: 20px; margin-bottom: 20px; }
        .info-item { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
        th { background-color: #28a745; color: white; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير المساهم الفردي</h1>
        <h2>${investor.fullName}</h2>
        <p>تاريخ الإنشاء: ${reportData.generated}</p>
      </div>
      
      <div class="info-section">
        <h3>المعلومات الأساسية</h3>
        <div class="info-item"><strong>الاسم:</strong> ${investor.fullName}</div>
        <div class="info-item"><strong>الرقم الوطني:</strong> ${investor.nationalId}</div>
        <div class="info-item"><strong>مبلغ المساهمة:</strong> ${investor.amountContributed?.toLocaleString()} ${investor.currency}</div>
        <div class="info-item"><strong>نسبة المساهمة:</strong> ${investor.sharePercentage}%</div>
      </div>
      
      ${reportData.profits && reportData.profits.length > 0 ? `
      <div class="info-section">
        <h3>ملخص الأرباح</h3>
        <table>
          <thead>
            <tr>
              <th>السنة المالية</th>
              <th>مبلغ الاستثمار</th>
              <th>عدد الأيام</th>
              <th>الربح المحسوب</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.profits.map(profit => `
              <tr>
                <td style="color: #28a745; font-weight: bold;">${profit.profitYear}</td>
                <td>${profit.investmentAmount?.toLocaleString() || 0} ${profit.currency || 'IQD'}</td>
                <td>${profit.totalDays || 0} يوم</td>
                <td style="color: #28a745; font-weight: bold;">${profit.calculatedProfit?.toLocaleString() || 0} ${profit.currency || 'IQD'}</td>
                <td>${profit.status === 'calculated' ? 'محسوب' : profit.status === 'approved' ? 'موافق عليه' : profit.status === 'distributed' ? 'موزع' : profit.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${transactions.length > 0 ? `
        <h3>الحركات المالية</h3>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>سنة الأرباح</th>
              <th>الوصف</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(transaction => `
              <tr>
                <td>${new Date(transaction.transactionDate).toLocaleDateString('ar-SA')}</td>
                <td style="color: ${transaction.type === 'deposit' ? '#28a745' : transaction.type === 'withdrawal' ? '#ffc107' : transaction.type === 'profit' ? '#007bff' : '#6c757d'};">
                  ${transaction.type === 'deposit' ? 'إيداع' : transaction.type === 'withdrawal' ? 'سحب' : transaction.type === 'profit' ? 'أرباح' : transaction.type}
                </td>
                <td>${transaction.amount.toLocaleString()} ${transaction.currency}</td>
                <td style="color: #28a745; font-weight: bold;">
                  ${transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear : '-'}
                </td>
                <td>${transaction.description || transaction.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};