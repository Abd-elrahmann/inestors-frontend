import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const createTable = (doc, headers, rows, startY, options = {}) => {
  const {
    fontSize = 10,
    cellPadding = 3,
    headerColor = [40, 167, 69],
    headerTextColor = 255,
    cellHeight = 10,
    colWidths = Array(headers.length).fill((doc.internal.pageSize.width - 40) / headers.length)
  } = options;

  let currentY = startY;
  
  doc.setFillColor(...headerColor);
  doc.rect(20, currentY, doc.internal.pageSize.width - 40, cellHeight, 'F');
  doc.setTextColor(headerTextColor);
  doc.setFontSize(fontSize);
  
  headers.forEach((header, i) => {
    doc.text(header.toString(), 20 + cellPadding + (i * colWidths[i]), currentY + (cellHeight / 2), {
      baseline: 'middle'
    });
  });
  
  currentY += cellHeight;
  doc.setTextColor(0);
  
  rows.forEach((row, rowIndex) => {
    if (currentY > doc.internal.pageSize.height - 20) {
      doc.addPage();
      currentY = 20;
      
      doc.setFillColor(...headerColor);
      doc.rect(20, currentY, doc.internal.pageSize.width - 40, cellHeight, 'F');
      doc.setTextColor(headerTextColor);
      
      headers.forEach((header, i) => {
        doc.text(header.toString(), 20 + cellPadding + (i * colWidths[i]), currentY + (cellHeight / 2), {
          baseline: 'middle'
        });
      });
      
      currentY += cellHeight;
      doc.setTextColor(0);
    }
    
    if (rowIndex % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, doc.internal.pageSize.width - 40, cellHeight, 'F');
    }
    
    row.forEach((cell, i) => {
      doc.text(cell.toString(), 20 + cellPadding + (i * colWidths[i]), currentY + (cellHeight / 2), {
        baseline: 'middle'
      });
    });
    
    currentY += cellHeight;
  });
  
  return currentY;
};

export const exportInvestorsSummaryToPDF = (data, dateRange) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Investors Summary Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  // Sanitize date range string by removing invalid characters
  const sanitizedDateRange = dateRange.replace(/[^\x20-\x7E]/g, '');
  doc.text(`Period: ${sanitizedDateRange}`, 105, 30, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
  
  const headers = ['Name', 'National ID', 'Investment', 'Share percentage'];
  const rows = data.map(investor => [
    investor.name,
    investor.nationalId,
    `${investor.totalInvestment.toLocaleString()} IQD`,
    `${investor.sharePercentage}%`
  ]);
  
  createTable(doc, headers, rows, 50);
  doc.save('investors-summary-report.pdf');
};

export const exportTransactionsToPDF = (data, dateRange) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Financial Transactions Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  // Sanitize date range string
  const sanitizedDateRange = dateRange.replace(/[^\x20-\x7E]/g, '');
  doc.text(`Period: ${sanitizedDateRange}`, 105, 30, { align: 'center' });
  
  const headers = ['Date', 'Investor', 'Type', 'Amount'];
  const rows = data.map(transaction => [
    transaction.date,
    transaction.investor,
    transaction.type,
    `${transaction.amount.toLocaleString()} IQD`,
  ]);
  
  createTable(doc, headers, rows, 50);
  doc.save('financial-transactions-report.pdf');
};

export const exportProfitDistributionToPDF = (data, dateRange) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Profit Distribution Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  // Sanitize date range string
  const sanitizedDateRange = dateRange.replace(/[^\x20-\x7E]/g, '');
  doc.text(`Period: ${sanitizedDateRange}`, 105, 30, { align: 'center' });
  
  const headers = ['Investor', 'Investment', 'Days', 'Profit', 'Rate %'];
  const rows = data.map(profit => [
    profit.investor,
    `${profit.investment.toLocaleString()} IQD`,
    profit.days.toString(),
    `${profit.profit.toLocaleString()} IQD`,
    `${profit.profitRate}%`
  ]);
  
  createTable(doc, headers, rows, 50);
  doc.save('profit-distribution-report.pdf');
};

export const exportIndividualInvestorToPDF = (reportData) => {
  const doc = new jsPDF();
  const investor = reportData.investor;
  const transactions = reportData.transactions;
  
  doc.setFontSize(18);
  doc.text('Individual Investor Report', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Investor: ${investor.fullName}`, 105, 35, { align: 'center' });
  doc.setFontSize(12);
  
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
  doc.text(`Share Percentage: ${investor.sharePercentage}%`, 30, yPosition);
  yPosition += 15;
  
  if (reportData.profits && reportData.profits.length > 0) {
    doc.setFontSize(14);
    doc.text('Profit Distributions:', 20, yPosition);
    yPosition += 10;
    
    const profitHeaders = ['Year', 'Investment', 'Days', 'Profit', 'Status'];
    const profitRows = reportData.profits.map(profit => {   
      const startDate = new Date(profit.year.startDate);
      const endDate = new Date(profit.year.endDate);
      const today = new Date();
      const actualEndDate = today < endDate ? today : endDate;
      
      const daysPassed = Math.floor((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return [
        profit.year.year.toString(),
        `${profit.investmentAmount?.toLocaleString() || '0'} ${profit.currency || 'IQD'}`,
        `${daysPassed} days`,
        `${profit.calculatedProfit?.toLocaleString() || '0'} ${profit.currency || 'IQD'}`,
        profit.status === 'calculated' ? 'Calculated' : 
        profit.status === 'approved' ? 'Approved' : 
        profit.status === 'distributed' ? 'Distributed' : profit.status
      ];
    });
    
    yPosition = createTable(doc, profitHeaders, profitRows, yPosition) + 15;
  }
  
  if (transactions.length > 0) {
    const headers = ['Date', 'Type', 'Amount', 'Profit Year'];
    const rows = transactions.map(transaction => [
      new Date(transaction.transactionDate).toLocaleDateString(),
      transaction.type === 'deposit' ? 'Deposit' : 
      transaction.type === 'withdrawal' ? 'Withdrawal' :
      transaction.type === 'profit' ? 'Profit' : transaction.type,
      `${transaction.amount.toLocaleString()} ${transaction.currency}`,
      transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear.toString() : '-',
    ]);
    
    createTable(doc, headers, rows, yPosition);
  }
  
  doc.save(`investor-report-${investor.fullName.replace(/\s+/g, '-')}.pdf`);
};

export const exportFinancialYearToPDF = (financialYear) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Financial Year ${financialYear.year} Report`, 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
  
  let yPosition = 50;
  doc.setFontSize(14);
  doc.text('Financial Year Information:', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.text(`Year: ${financialYear.year}`, 30, yPosition); yPosition += 7;
  doc.text(`Start Date: ${new Date(financialYear.startDate).toLocaleDateString()}`, 30, yPosition); yPosition += 7;
  doc.text(`End Date: ${new Date(financialYear.endDate).toLocaleDateString()}`, 30, yPosition); yPosition += 7;
  doc.text(`Total Days: ${financialYear.totalDays-1}`, 30, yPosition); yPosition += 7;
  doc.text(`Total Profit: ${financialYear.totalProfit?.toLocaleString()} ${financialYear.currency}`, 30, yPosition); yPosition += 7;
  doc.text(`Daily Profit Rate: ${financialYear.dailyProfitRate?.toFixed(6)}`, 30, yPosition); yPosition += 7;
  doc.text(`Status: ${financialYear.status}`, 30, yPosition); yPosition += 15;
  
  if (financialYear.distributions && financialYear.distributions.length > 0) {
    doc.setFontSize(14);
    doc.text('Profit Distributions:', 20, yPosition);
    yPosition += 10;
    
    const headers = ['Investor', 'Investment', 'Days', 'Profit', 'Status'];
    const rows = financialYear.distributions.map(dist => [
      dist.investorId?.fullName || 'N/A',
      `${dist.calculation?.investmentAmount?.toLocaleString() || '0'} ${dist.currency}`,
      dist.calculation?.totalDays?.toString() || '0',
      `${dist.calculation?.calculatedProfit?.toLocaleString() || '0'} ${dist.currency}`,
      dist.status === 'calculated' ? 'Calculated' : 
      dist.status === 'approved' ? 'Approved' : 
      dist.status === 'distributed' ? 'Distributed' : dist.status
    ]);
    
    createTable(doc, headers, rows, yPosition);
  }
  
  doc.save(`financial-year-${financialYear.year}-report.pdf`);
};

export const exportToExcel = (data, reportType) => {
  let worksheetData = [];
  let filename = '';
  let investor, transactions;

  switch (reportType) {
    case 'investors_summary':
      filename = 'investors-summary-report.xlsx';
      worksheetData = [
        ['Investor Name', 'National ID', 'Total Investment', 'Share Percentage'],
        ...data.map(investor => [
          investor.name,
          investor.nationalId,
          investor.totalInvestment,
          investor.sharePercentage
        ])
      ];
      break;
      
    case 'financial_transactions':
      filename = 'financial-transactions-report.xlsx';
      worksheetData = [
        ['Date', 'Investor', 'Type', 'Amount'],
        ...data.map(transaction => [
          transaction.date,
          transaction.investor,
          transaction.type,
          transaction.amount,
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
      
    case 'financial_year':
      filename = `financial-year-${data.year}-report.xlsx`;
      worksheetData = [
        ['Financial Year Information'],
        ['Year', data.year],
        ['Start Date', new Date(data.startDate).toLocaleDateString()],
        ['End Date', new Date(data.endDate).toLocaleDateString()],
        ['Total Days', data.totalDays-1],
        ['Total Profit', `${data.totalProfit?.toLocaleString()} ${data.currency}`],
        ['Daily Profit Rate', data.dailyProfitRate?.toFixed(6)],
        ['Status', data.status],
        [],
        ['Profit Distributions'],
        ['Investor', 'Investment', 'Days', 'Profit', 'Status'],
        ...(data.distributions || []).map(dist => [
          dist.investorId?.fullName || 'N/A',
          `${dist.calculation?.investmentAmount?.toLocaleString() || '0'} ${dist.currency}`,
          dist.calculation?.totalDays?.toString() || '0',
          `${dist.calculation?.calculatedProfit?.toLocaleString() || '0'} ${dist.currency}`,
          dist.status
        ])
      ];
      break;
      
    case 'individual_investor':
      investor = data.investor;
      transactions = data.transactions;
      filename = `investor-report-${investor.fullName.replace(/\s+/g, '-')}.xlsx`;
      
      // Basic Information
      worksheetData = [
        ['Individual Investor Report'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Basic Information'],
        ['Name', investor.fullName],
        ['National ID', investor.nationalId],
        ['Investment Amount', `${investor.amountContributed?.toLocaleString()} ${investor.currency}`],
        ['Share Percentage', `${investor.sharePercentage}%`],
        []
      ];

      // Profits Section
      if (data.profits && data.profits.length > 0) {
        worksheetData.push(
          ['Profit Summary'],
          ['Financial Year', 'Investment Amount', 'Days', 'Calculated Profit', 'Status']
        );
        
        data.profits.forEach(profit => {
          const startDate = new Date(profit.year.startDate);
          const endDate = new Date(profit.year.endDate);
          const today = new Date();
          const actualEndDate = today < endDate ? today : endDate;
          const daysPassed = Math.floor((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          
          worksheetData.push([
            profit.year.year.toString(),
            `${profit.investmentAmount?.toLocaleString() || '0'} ${profit.currency || 'IQD'}`,
            `${daysPassed} days`,
            `${profit.calculatedProfit?.toLocaleString() || '0'} ${profit.currency || 'IQD'}`,
            profit.status === 'calculated' ? 'Calculated' : 
            profit.status === 'approved' ? 'Approved' : 
            profit.status === 'distributed' ? 'Distributed' : profit.status
          ]);
        });
        
        worksheetData.push([]);
      }

      // Transactions Section
      if (transactions.length > 0) {
        worksheetData.push(
          ['Financial Transactions'],
          ['Date', 'Type', 'Amount', 'Profit Year']
        );
        
        transactions.forEach(transaction => {
          worksheetData.push([
            new Date(transaction.transactionDate).toLocaleDateString(),
            transaction.type === 'deposit' ? 'Deposit' : 
            transaction.type === 'withdrawal' ? 'Withdrawal' :
            transaction.type === 'profit' ? 'Profit' : transaction.type,
            `${transaction.amount.toLocaleString()} ${transaction.currency}`,
            transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear.toString() : '-',
          ]);
        });
      }
      break;
      
    default:
      filename = 'report.xlsx';
      worksheetData = data;
  }
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  XLSX.writeFile(workbook, filename);
};
    
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
                <td style="color: #28a745; font-weight: bold;">${profit.year}</td>
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
            </tr>
          </thead>
          <tbody>
            ${transactions.map(transaction => `
              <tr>
                <td>${new Date(transaction.transactionDate).toLocaleDateString('ar-SA')}</td>
                <td style="color: ${transaction.type === 'deposit' ? '#28a745' : transaction.type === 'withdrawal' ? '#ffc107' : transaction.type === 'profit' ? '#007bff' : '#6c757d'};">
                  ${transaction.type === 'deposit' ? 'deposit' : transaction.type === 'withdrawal' ? 'withdrawl' : transaction.type === 'profit' ? 'أرباح' : transaction.type}
                </td>
                <td>${transaction.amount.toLocaleString()} ${transaction.currency}</td>
                <td style="color: #28a745; font-weight: bold;">
                  ${transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear : '-'}
                </td>
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