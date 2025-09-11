import * as XLSX from 'xlsx';
import { formatCurrency } from "./globalCurrencyManager";

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [40, 167, 69]; // Default to #28a745 if invalid
};

const headerColor = hexToRgb('#28a745');

// Helper function to format transaction types
const formatTransactionType = (type) => {
  switch (type) {
    case 'DEPOSIT': return 'إيداع';
    case 'WITHDRAWAL': return 'سحب';
    case 'PROFIT': return 'ربح';
    default: return '-';
  }
};

export const exportAllInvestorsToPDF = async (data, settings) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    doc.setFontSize(18);
    doc.text('تقرير جميع المستثمرين', doc.internal.pageSize.width / 2, 20, {
      align: 'center'
    });

    const currentCurrency = settings?.defaultCurrency || 'USD';
    
    const headers = [
      'الاسم', 
      'الهاتف', 
      ' رأس المال', 
      'مبلغ الربح', 
      'المجموع',
      'تاريخ الانضمام'
    ];
    
    const rows = data.map(investor => [
      investor.fullName,
      investor.phone,
      formatCurrency(investor.amount || 0, 'USD', currentCurrency),
      formatCurrency(investor.rollover_amount || 0, 'USD', currentCurrency),
      formatCurrency(investor.amount + investor.rollover_amount || 0, 'USD', currentCurrency),
      investor.createdAt
    ]);

    autoTableModule.default(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: 255,
        font: 'Amiri',
        fontStyle: 'bold',
      },
      bodyStyles: {
        font: 'Amiri'
      },
      styles: {
        halign: 'right',
        font: 'Amiri'
      },
      didParseCell: (data) => {
        data.cell.styles.halign = 'right';
      }
    });

    doc.save('تقرير-جميع-المستثمرين.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportIndividualInvestorToPDF = async (data, settings) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    doc.setFontSize(18);
    doc.text('تقرير المستثمر الفردي', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`المستثمر: ${data.fullName}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

    let startY = 40;
    
    const currentCurrency = settings?.defaultCurrency || 'USD';
    
    const infoHeaders = ['الاسم', 'الهاتف', ' رأس المال', 'مبلغ الربح', 'المجموع', 'تاريخ الانضمام'];
    const infoRows = [[
      data.fullName,
      data.phone,
      formatCurrency(data.amount || 0, 'USD', currentCurrency),
      formatCurrency(data.rollover_amount || 0, 'USD', currentCurrency),
      formatCurrency(data.amount + data.rollover_amount || 0, 'USD', currentCurrency),
      data.createdAt
    ]];
    
    autoTableModule.default(doc, {
      head: [infoHeaders],
      body: infoRows,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: 255,
        font: 'Amiri',
        fontStyle: 'bold',
        direction: 'rtl'
      },
      bodyStyles: {
        font: 'Amiri'
      },
      styles: {
        halign: 'right',
        font: 'Amiri'
      }
    });
    
    if (data.transactions && data.transactions.length > 0) {
      startY = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.text('المعاملات', 20, startY, { align: 'center' });
      startY += 10;
      
      const transHeaders = ['النوع', `المبلغ`, 'العملة', 'مصدر العملية', 'السنة المالية', 'التاريخ'];
      const transRows = data.transactions.filter(transaction => transaction.status !== 'CANCELED').map(transaction => [
        formatTransactionType(transaction.type),
        formatCurrency(transaction.amount || 0, transaction.currency || 'USD', currentCurrency),
        transaction.currency || 'USD',
        transaction.withdrawSource === "AMOUNT_ROLLOVER" ? " مبلغ الربح + رأس المال" : transaction.withdrawSource === "ROLLOVER" ? "مبلغ الربح" : '-',
        transaction.financialYear ? `${transaction.financialYear.year || '-'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : '-',
        transaction.date
      ]);
      
      autoTableModule.default(doc, {
        head: [transHeaders],
        body: transRows,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: 255,
          font: 'Amiri',
          fontStyle: 'bold',
          direction: 'rtl'
        },
        bodyStyles: {
          font: 'Amiri'
        },
        styles: {
          halign: 'right',
          font: 'Amiri'
        }
      });
    }

    if (data.profitDistributions && data.profitDistributions.length > 0) {
      startY = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.text('توزيعات الأرباح', 20, startY, { align: 'center' });
      startY += 10;

      const distHeaders = [
        'السنة المالية', 
        `رأس المال`, 
        'العملة', 
        `الربح اليومي`, 
        `إجمالي الربح`, 
        'تاريخ الموافقة'
      ];
      
      const distRows = data.profitDistributions.map(distribution => [
        `${distribution.financialYear.year} - ${distribution.financialYear.periodName}`,
        formatCurrency(distribution.amount || 0, 'USD', currentCurrency),
        distribution.currency || 'USD',
        formatCurrency(distribution.dailyProfit || 0, 'USD', currentCurrency),
        formatCurrency(distribution.financialYear.totalRollover || 0, 'USD', currentCurrency),
        distribution.financialYear.approvedAt
      ]);

      autoTableModule.default(doc, {
        head: [distHeaders],
        body: distRows,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: 255,
          font: 'Amiri',
          fontStyle: 'bold',
          direction: 'rtl'
        },
        bodyStyles: {
          font: 'Amiri'
        },
        styles: {
          halign: 'right',
          font: 'Amiri'
        }
      });
    }
    
    doc.save(`تقرير-المستثمر-${data.fullName.replace(/\s+/g, '-')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportTransactionsToPDF = async (data, settings) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    doc.setFontSize(18);
    doc.text('تقرير المعاملات', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    const currentCurrency = settings?.defaultCurrency || 'USD';
    
    const headers = [
      'المستثمر', 
      'النوع', 
      `المبلغ`, 
      'العملة', 
      'مصدر العملية',
      'السنة المالية', 
      'التاريخ'
    ];
    
    const rows = data.filter(transaction => transaction.status !== 'CANCELED').map(transaction => [
      transaction.investors?.fullName || '-',
      formatTransactionType(transaction.type),
      formatCurrency(transaction.amount || 0, transaction.currency || 'USD', currentCurrency),
      transaction.currency || 'USD',
      transaction.withdrawSource === "AMOUNT_ROLLOVER" ? " مبلغ الربح + رأس المال" : transaction.withdrawSource === "ROLLOVER" ? "مبلغ الربح" : '-',
      transaction.financialYear ? `${transaction.financialYear.year || '-'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : '-',
      transaction.date
    ]);
    
    autoTableModule.default(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: 255,
        font: 'Amiri',
        fontStyle: 'bold',
        direction: 'rtl'
      },
      bodyStyles: {
        font: 'Amiri'
      },
      styles: {
        halign: 'right',
        font: 'Amiri'
      },
      didParseCell: (data) => {
        data.cell.styles.halign = 'right';
      }
    });
    
    doc.save('تقرير-المعاملات.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportFinancialYearToPDF = async (data, settings) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();
    
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    // عنوان التقرير
    doc.setFontSize(18);
    doc.text(`تقرير السنة المالية - ${data.periodName}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    let startY = 30;
    
    const currentCurrency = settings?.defaultCurrency || 'USD';
    const currencySymbol = currentCurrency === 'USD' ? '$' : 'د.ع';
    // Financial year information table
    const statusMap = {
      'PENDING': 'في انتظار الموافقة',
      'DISTRIBUTED': 'موزع'
    };
    
    const infoHeaders = ['السنة', 'الفترة', 'مبلغ التوزيع', 'الحالة', 'تاريخ البداية', 'تاريخ النهاية'];
    const infoRows = [[
      data.year,
      data.periodName,
      `${formatCurrency(data.totalProfit || 0, 'USD', currentCurrency)} ${currencySymbol}`,
      statusMap[data.status] || data.status,
      data.startDate,
      data.endDate
    ]];
    
    autoTableModule.default(doc, {
      head: [infoHeaders],
      body: infoRows,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: headerColor,
        textColor: 255,
        font: 'Amiri',
        fontStyle: 'bold',
        direction: 'rtl'
      },
      bodyStyles: {
        font: 'Amiri'
      },
      styles: {
        halign: 'right',
        font: 'Amiri'
      }
    });
    
    // Profit distributions table
    if (data.profitDistributions && data.profitDistributions.length > 0) {
      startY = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.text('توزيعات الأرباح', 20, startY, { align: 'center' });
      startY += 10;
      
      const distHeaders = [
        'ت',
        'المستثمر',
        'المجموع',
        'ايام المستثمر',
        'الربح اليومي',
        'المجموع',
        'تاريخ المساهمة',
        'تاريخ الموافقة'
      ];
      
      const distRows = data.profitDistributions.map(distribution => [
        distribution.investors?.id || '-',
        distribution.investors?.fullName || '-',
        `${formatCurrency(distribution.amount || 0, 'USD', currentCurrency)} ${currencySymbol}`,
        distribution.daysSoFar || '-',
        `${formatCurrency(distribution.dailyProfit || 0, 'USD', currentCurrency)} ${currencySymbol}`,
        `${formatCurrency(distribution.totalProfit || 0, 'USD', currentCurrency)} ${currencySymbol}`,
        distribution.investors?.createdAt || '-',
        data.approvedAt || '-'
      ]);
      
      autoTableModule.default(doc, {
        head: [distHeaders],
        body: distRows,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          textColor: 255,
          font: 'Amiri',
          fontStyle: 'bold',
          direction: 'rtl'
        },
        bodyStyles: {
          font: 'Amiri'
        },
        styles: {
          halign: 'right',
          font: 'Amiri'
        }
      });
    }
    
    doc.save(`تقرير-السنة-المالية-${data.periodName.replace(/\s+/g, '-')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
export const exportToExcel = (data, reportType, settings) => {
  let worksheetData = [];
  let filename = '';
  const currentCurrency = settings?.defaultCurrency || 'USD';

  // دالة لتنسيق رؤوس الجداول في Excel
  const createStyledHeader = (headers) => {
    return headers.map(header => ({
      v: header,
      s: {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: '28a745' }
        },
        font: {
          color: { rgb: 'FFFFFF' },
          bold: true
        },
        alignment: {
          horizontal: 'right',
          direction: 'rtl'
        }
      }
    }));
  };

  switch (reportType) {
    case 'investors':
      filename = 'تقرير-جميع-المستثمرين.xlsx';
      worksheetData = [
        createStyledHeader(['الاسم', 'الهاتف', 'مبلغ المساهمة', 'مبلغ الربح', 'تاريخ الإنشاء']),
        ...data.map(investor => [
          investor.fullName,
          investor.phone,
          formatCurrency(investor.amount || 0, 'USD', currentCurrency),
          formatCurrency(investor.rollover_amount || 0, 'USD', currentCurrency),
          investor.createdAt
        ])
      ];
      break;
      
    case 'individual':
      filename = `تقرير-المستثمر-${data.fullName.replace(/\s+/g, '-')}.xlsx`;
      worksheetData = [
        createStyledHeader(['الاسم', 'الهاتف', 'مبلغ المساهمة', 'مبلغ الربح', 'تاريخ الإنشاء']),
        [
          data.fullName,
          data.phone,
          formatCurrency(data.amount || 0, 'USD', currentCurrency),
          formatCurrency(data.rollover_amount || 0, 'USD', currentCurrency),
          data.createdAt
        ],
        [],
        createStyledHeader(['المعاملات']),  
        createStyledHeader(['النوع', 'المبلغ', 'العملة', 'مصدر العملية', 'السنة المالية', 'التاريخ']),
        ...(data.transactions || []).filter(transaction => transaction.status !== 'CANCELED').map(transaction => [
          formatTransactionType(transaction.type),
          formatCurrency(transaction.amount || 0, transaction.currency || 'USD', currentCurrency),
          transaction.currency || 'USD',
          transaction.withdrawSource === "AMOUNT_ROLLOVER" ? " مبلغ الربح + رأس المال" : transaction.withdrawSource === "ROLLOVER" ? "مبلغ الربح" : '-',
          transaction.financialYear ? `${transaction.financialYear.year || '-'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : '-',
          transaction.date
        ]),
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['السنة المالية', 'رأس المال', 'العملة', 'الربح اليومي', 'إجمالي الربح', 'تاريخ الموافقة']),
        ...(data.profitDistributions || []).map(distribution => [
          `${distribution.financialYear.year} - ${distribution.financialYear.periodName}`,
          formatCurrency(distribution.amount || 0, 'USD', currentCurrency),
          distribution.currency || 'USD',
          formatCurrency(distribution.dailyProfit || 0, 'USD', currentCurrency),
          formatCurrency(distribution.financialYear.totalRollover || 0, 'USD', currentCurrency),
          distribution.financialYear.approvedAt
        ])
      ];
      break;
      
    case 'transactions':
      filename = 'تقرير-المعاملات.xlsx';
      worksheetData = [
        createStyledHeader(['المستثمر', 'النوع', 'المبلغ', 'العملة', 'مصدر العملية', 'السنة المالية', 'التاريخ']),
        ...data.filter(transaction => transaction.status !== 'CANCELED').map(transaction => [
          transaction.investors?.fullName || '-',
          formatTransactionType(transaction.type),
          formatCurrency(transaction.amount || 0, transaction.currency || 'USD', currentCurrency),
          transaction.currency || 'USD',
          transaction.withdrawSource === "AMOUNT_ROLLOVER" ? " مبلغ الربح + رأس المال" : transaction.withdrawSource === "ROLLOVER" ? "مبلغ الربح" : '-',
          transaction.financialYear ? `${transaction.financialYear.year || '-'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : '-',
          transaction.date
        ])
      ];
      break;
      
    case 'financial-year': {
      filename = `تقرير-السنة-المالية-${data.periodName.replace(/\s+/g, '-')}.xlsx`;
      const statusMap = { 
        'PENDING': 'في انتظار الموافقة',
        'DISTRIBUTED': 'موزع'
      };
        
      worksheetData = [
        createStyledHeader(['السنة', 'الفترة', 'مبلغ التوزيع', 'الحالة', 'تاريخ البداية', 'تاريخ النهاية']),
        [
          data.year,
          data.periodName,
          formatCurrency(data.totalProfit || 0, 'USD', currentCurrency),
          statusMap[data.status] || data.status,
          data.startDate,
          data.endDate
        ],
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['ت', 'المستثمر', 'المجموع', 'ايام المستثمر', 'الربح اليومي', 'المجموع', 'تاريخ المساهمة', 'تاريخ الموافقة']),
        ...(data.profitDistributions || []).map(distribution => [
          distribution.investors?.id || '-',
          distribution.investors?.fullName || '-',
          formatCurrency(distribution.amount || 0, 'USD', currentCurrency),
          distribution.daysSoFar || '-',
          formatCurrency(distribution.dailyProfit || 0, 'USD', currentCurrency),
          formatCurrency(distribution.totalProfit || 0, 'USD', currentCurrency),
          distribution.investors?.createdAt || '-',
          data.approvedAt || '-'
        ])
      ];
      break;
    }
    default:
      filename = 'تقرير.xlsx';
      worksheetData = data;
  }
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // تعيين اتجاه النص إلى RTL للخلايا
  if (!worksheet['!fullCells']) worksheet['!fullCells'] = [];
  for (const cell in worksheet) {
    if (cell[0] === '!') continue;
    if (!worksheet[cell].s) worksheet[cell].s = {};
    if (!worksheet[cell].s.alignment) worksheet[cell].s.alignment = {};
    worksheet[cell].s.alignment.horizontal = 'right';
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
  XLSX.writeFile(workbook, filename);
};