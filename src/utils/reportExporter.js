import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

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
      baseline: 'middle',
      align: 'left'
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
          baseline: 'middle',
          align: 'left'
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
        baseline: 'middle',
        align: 'left'
      });
    });
    
    currentY += cellHeight;
  });
  
  return currentY;
};

const registerAmiriFont = (doc) => {
  try {
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');
    return true;
  } catch (error) {
    console.error('خطأ في تحميل خط أميري:', error);
    return false;
  }
};

export const exportInvestorsSummaryToPDF = (data) => {
  const doc = new jsPDF();
  doc.setR2L(false); // Set to false to fix text direction
  registerAmiriFont(doc);
  doc.setFontSize(18);
  doc.text('تقرير ملخص المستثمرين', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  
  const headers = ['الاسم', 'الرقم الوطني', 'الاستثمار', 'نسبة المساهمة'];
  const rows = data.map(investor => [
    investor.name,
    investor.nationalId,
    `${investor.totalInvestment.toLocaleString()} د.ع`,
    `${investor.sharePercentage}%`
  ]);
  
  createTable(doc, headers, rows, 50);
  doc.save('تقرير-ملخص-المستثمرين.pdf');
};

export const exportTransactionsToPDF = (data) => {
  const doc = new jsPDF();
  doc.setR2L(false); // Set to false to fix text direction
  registerAmiriFont(doc);
  doc.setFontSize(18);
  doc.text('تقرير المعاملات المالية', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  
  const headers = ['التاريخ', 'المستثمر', 'النوع', 'المبلغ'];
  const rows = data.map(transaction => [
    new Date(transaction.date).toLocaleDateString('ar-SA'),
    transaction.investor,
    transaction.type === 'deposit' ? 'إيداع' : 
    transaction.type === 'withdrawal' ? 'سحب' :
    transaction.type === 'profit' ? 'ربح' : transaction.type,
    `${transaction.amount.toLocaleString()} د.ع`,
  ]);
  
  createTable(doc, headers, rows, 50);
  doc.save('تقرير-المعاملات-المالية.pdf');
};

export const exportProfitDistributionToPDF = (data) => {
  const doc = new jsPDF();
  doc.setR2L(false); // Set to false to fix text direction
  registerAmiriFont(doc);
  doc.setFontSize(18);
  doc.text('تقرير توزيع الأرباح', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  
  const headers = ['المستثمر', 'الاستثمار', 'الأيام', 'الربح', 'النسبة %'];
  const rows = data.map(profit => [
    profit.investor,
    `${profit.investment.toLocaleString()} د.ع`,
    profit.days.toString(),
    `${profit.profit.toLocaleString()} د.ع`,
    `${profit.profitRate}%`
  ]);
  
  createTable(doc, headers, rows, 50);
  doc.save('تقرير-توزيع-الأرباح.pdf');
};

export const exportIndividualInvestorToPDF = (reportData) => {
  const doc = new jsPDF();
  doc.setR2L(false); // Set to false to fix text direction
  const investor = reportData.investor;
  const transactions = reportData.transactions;
  
  registerAmiriFont(doc);
  doc.setFontSize(18);
  doc.text('تقرير المستثمر الفردي', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`المستثمر: ${investor.fullName}`, 105, 35, { align: 'center' });
  doc.setFontSize(12);
  
  let yPosition = 60;
  doc.setFontSize(14);
  doc.text('معلومات المستثمر:', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.text(`الاسم: ${investor.fullName}`, 30, yPosition);
  yPosition += 7;
  doc.text(`الرقم الوطني: ${investor.nationalId}`, 30, yPosition);
  yPosition += 7;
  doc.text(`الاستثمار: ${investor.amountContributed?.toLocaleString()} ${investor.currency}`, 30, yPosition);
  yPosition += 7;
  doc.text(`نسبة المساهمة: ${investor.sharePercentage}%`, 30, yPosition);
  yPosition += 15;
  
  if (reportData.profits && reportData.profits.length > 0) {
    doc.setFontSize(14);
    doc.text('توزيعات الأرباح:', 20, yPosition);
    yPosition += 10;
    
    const profitHeaders = ['السنة', 'الاستثمار', 'الأيام', 'الربح', 'الحالة'];
    const profitRows = reportData.profits.map(profit => {   
      const startDate = new Date(profit.year.startDate);
      const endDate = new Date(profit.year.endDate);
      const today = new Date();
      const actualEndDate = today < endDate ? today : endDate;
      
      const daysPassed = Math.floor((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return [
        profit.year.year.toString(),
        `${profit.investmentAmount?.toLocaleString() || '0'} ${profit.currency || 'د.ع'}`,
        `${daysPassed} يوم`,
        `${profit.calculatedProfit?.toLocaleString() || '0'} ${profit.currency || 'د.ع'}`,
        profit.status === 'calculated' ? 'محسوب' : 
        profit.status === 'approved' ? 'معتمد' : 
        profit.status === 'distributed' ? 'موزع' : profit.status
      ];
    });
    
    yPosition = createTable(doc, profitHeaders, profitRows, yPosition) + 15;
  }
  
  if (transactions.length > 0) {
    const headers = ['التاريخ', 'النوع', 'المبلغ', 'سنة الربح'];
    const rows = transactions.map(transaction => [
      new Date(transaction.transactionDate).toLocaleDateString('ar-SA'),
      transaction.type === 'deposit' ? 'إيداع' : 
      transaction.type === 'withdrawal' ? 'سحب' :
      transaction.type === 'profit' ? 'ربح' : transaction.type,
      `${transaction.amount.toLocaleString()} ${transaction.currency}`,
      transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear.toString() : '-',
    ]);
    
    createTable(doc, headers, rows, yPosition);
  }
  
  doc.save(`تقرير-المستثمر-${investor.fullName.replace(/\s+/g, '-')}.pdf`);
};

export const exportFinancialYearToPDF = (financialYear) => {
  const doc = new jsPDF();
  doc.setR2L(false); // Set to false to fix text direction
  registerAmiriFont(doc);
  doc.setFontSize(18);
  doc.text(`تقرير السنة المالية ${financialYear.year}`, 105, 20, { align: 'center' });
  doc.setFontSize(12);
  
  let yPosition = 50;
  doc.setFontSize(14);
  doc.text('معلومات السنة المالية:', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.text(`السنة: ${financialYear.year}`, 30, yPosition); yPosition += 7;
  doc.text(`تاريخ البداية: ${new Date(financialYear.startDate).toLocaleDateString('ar-SA')}`, 30, yPosition); yPosition += 7;
  doc.text(`تاريخ النهاية: ${new Date(financialYear.endDate).toLocaleDateString('ar-SA')}`, 30, yPosition); yPosition += 7;
  doc.text(`إجمالي الأيام: ${financialYear.totalDays-1}`, 30, yPosition); yPosition += 7;
  doc.text(`إجمالي الربح: ${financialYear.totalProfit?.toLocaleString()} ${financialYear.currency}`, 30, yPosition); yPosition += 7;
  doc.text(`معدل الربح اليومي: ${financialYear.dailyProfitRate?.toFixed(6)}`, 30, yPosition); yPosition += 7;
  doc.text(`الحالة: ${financialYear.status === 'active' ? 'نشط' : 'مغلق'}`, 30, yPosition); yPosition += 15;
  
  if (financialYear.distributions && financialYear.distributions.length > 0) {
    doc.setFontSize(14);
    doc.text('توزيعات الأرباح:', 20, yPosition);
    yPosition += 10;
    
    const headers = ['المستثمر', 'الاستثمار', 'الأيام', 'الربح', 'الحالة'];
    const rows = financialYear.distributions.map(dist => [
      dist.investorId?.fullName || 'غير متوفر',
      `${dist.calculation?.investmentAmount?.toLocaleString() || '0'} ${dist.currency}`,
      dist.calculation?.totalDays?.toString() || '0',
      `${dist.calculation?.calculatedProfit?.toLocaleString() || '0'} ${dist.currency}`,
      dist.status === 'calculated' ? 'محسوب' : 
      dist.status === 'approved' ? 'معتمد' : 
      dist.status === 'distributed' ? 'موزع' : dist.status
    ]);
    
    createTable(doc, headers, rows, yPosition);
  }
  
  doc.save(`تقرير-السنة-المالية-${financialYear.year}.pdf`);
};

export const exportToExcel = (data, reportType) => {
  let worksheetData = [];
  let filename = '';
  let investor, transactions;

  switch (reportType) {
    case 'investors_summary':
      filename = 'تقرير-ملخص-المستثمرين.xlsx';
      worksheetData = [
        ['اسم المستثمر', 'الرقم الوطني', 'إجمالي الاستثمار', 'نسبة المساهمة'],
        ...data.map(investor => [
          investor.name,
          investor.nationalId,
          investor.totalInvestment,
          investor.sharePercentage
        ])
      ];
      break;
      
    case 'financial_transactions':
      filename = 'تقرير-المعاملات-المالية.xlsx';
      worksheetData = [
        ['التاريخ', 'المستثمر', 'النوع', 'المبلغ'],
        ...data.map(transaction => [
          transaction.date,
          transaction.investor,
          transaction.type === 'deposit' ? 'إيداع' : 
          transaction.type === 'withdrawal' ? 'سحب' :
          transaction.type === 'profit' ? 'ربح' : transaction.type,
          transaction.amount,
        ])
      ];
      break;
      
    case 'profit_distribution':
      filename = 'تقرير-توزيع-الأرباح.xlsx';
      worksheetData = [
        ['المستثمر', 'مبلغ الاستثمار', 'الأيام', 'مبلغ الربح', 'نسبة الربح'],
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
      filename = 'تقرير-تحليل-الأداء.xlsx';
      worksheetData = [
        ['المقياس', 'القيمة'],
        ['إجمالي المستثمرين', data.totalInvestors],
        ['إجمالي رأس المال', data.totalCapital],
        ['إجمالي الأرباح', data.totalProfits],
        ['متوسط العائد', data.averageReturn],
        ['العمليات الشهرية', data.monthlyOperations],
        ['معدل النجاح', data.successRate]
      ];
      break;
      
    case 'financial_year':
      filename = `تقرير-السنة-المالية-${data.year}.xlsx`;
      worksheetData = [
        ['معلومات السنة المالية'],
        ['السنة', data.year],
        ['تاريخ البداية', new Date(data.startDate).toLocaleDateString('ar-SA')],
        ['تاريخ النهاية', new Date(data.endDate).toLocaleDateString('ar-SA')],
        ['إجمالي الأيام', data.totalDays-1],
        ['إجمالي الربح', `${data.totalProfit?.toLocaleString()} ${data.currency}`],
        ['معدل الربح اليومي', data.dailyProfitRate?.toFixed(6)],
        ['الحالة', data.status === 'active' ? 'نشط' : 'مغلق'],
        [],
        ['توزيعات الأرباح'],
        ['المستثمر', 'الاستثمار', 'الأيام', 'الربح', 'الحالة'],
        ...(data.distributions || []).map(dist => [
          dist.investorId?.fullName || 'غير متوفر',
          `${dist.calculation?.investmentAmount?.toLocaleString() || '0'} ${dist.currency}`,
          dist.calculation?.totalDays?.toString() || '0',
          `${dist.calculation?.calculatedProfit?.toLocaleString() || '0'} ${dist.currency}`,
          dist.status === 'calculated' ? 'محسوب' : 
          dist.status === 'approved' ? 'معتمد' : 
          dist.status === 'distributed' ? 'موزع' : dist.status
        ])
      ];
      break;
      
    case 'individual_investor':
      investor = data.investor;
      transactions = data.transactions;
      filename = `تقرير-المستثمر-${investor.fullName.replace(/\s+/g, '-')}.xlsx`;
      
      worksheetData = [
        ['تقرير المستثمر الفردي'],
        ['تاريخ الإنشاء', new Date().toLocaleString('ar-SA')],
        [],
        ['المعلومات الأساسية'],
        ['الاسم', investor.fullName],
        ['الرقم الوطني', investor.nationalId],
        ['مبلغ الاستثمار', `${investor.amountContributed?.toLocaleString()} ${investor.currency}`],
        ['نسبة المساهمة', `${investor.sharePercentage}%`],
        []
      ];

      if (data.profits && data.profits.length > 0) {
        worksheetData.push(
          ['ملخص الأرباح'],
          ['السنة المالية', 'مبلغ الاستثمار', 'الأيام', 'الربح المحسوب', 'الحالة']
        );
        
        data.profits.forEach(profit => {
          const startDate = new Date(profit.year.startDate);
          const endDate = new Date(profit.year.endDate);
          const today = new Date();
          const actualEndDate = today < endDate ? today : endDate;
          const daysPassed = Math.floor((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          
          worksheetData.push([
            profit.year.year.toString(),
            `${profit.investmentAmount?.toLocaleString() || '0'} ${profit.currency || 'د.ع'}`,
            `${daysPassed} يوم`,
            `${profit.calculatedProfit?.toLocaleString() || '0'} ${profit.currency || 'د.ع'}`,
            profit.status === 'calculated' ? 'محسوب' : 
            profit.status === 'approved' ? 'معتمد' : 
            profit.status === 'distributed' ? 'موزع' : profit.status
          ]);
        });
        
        worksheetData.push([]);
      }

      if (transactions.length > 0) {
        worksheetData.push(
          ['المعاملات المالية'],
          ['التاريخ', 'النوع', 'المبلغ', 'سنة الربح']
        );
        
        transactions.forEach(transaction => {
          worksheetData.push([
            new Date(transaction.transactionDate).toLocaleDateString('ar-SA'),
            transaction.type === 'deposit' ? 'إيداع' : 
            transaction.type === 'withdrawal' ? 'سحب' :
            transaction.type === 'profit' ? 'ربح' : transaction.type,
            `${transaction.amount.toLocaleString()} ${transaction.currency}`,
            transaction.type === 'profit' && transaction.profitYear ? transaction.profitYear.toString() : '-',
          ]);
        });
      }
      break;
      
    default:
      filename = 'تقرير.xlsx';
      worksheetData = data;
  }
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
  
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
        body { font-family: 'Amiri', Arial, sans-serif; margin: 20px; }
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
        <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}</p>
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
                <td>${profit.investmentAmount?.toLocaleString() || 0} ${profit.currency || 'د.ع'}</td>
                <td>${profit.totalDays || 0} يوم</td>
                <td style="color: #28a745; font-weight: bold;">${profit.calculatedProfit?.toLocaleString() || 0} ${profit.currency || 'د.ع'}</td>
                <td>${profit.status === 'calculated' ? 'محسوب' : profit.status === 'approved' ? 'معتمد' : profit.status === 'distributed' ? 'موزع' : profit.status}</td>
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
                  ${transaction.type === 'deposit' ? 'إيداع' : transaction.type === 'withdrawal' ? 'سحب' : transaction.type === 'profit' ? 'ربح' : transaction.type}
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