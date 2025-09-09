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
    case 'ROLLOVER': return 'تدوير';
    default: return 'غير محدد';
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

    const currentCurrency = settings?.defaultCurrency || 'IQD';
    
    const headers = [
      'الاسم', 
      'الهاتف', 
      'مبلغ المساهمة', 
      'مبلغ التدوير', 
      'نسبة المساهمة',
      'تاريخ الانضمام'
    ];
    
    const rows = data.map(investor => [
      investor.fullName,
      investor.phone,
      formatCurrency(investor.amount || 0, 'IQD', currentCurrency),
      formatCurrency(investor.rollover_amount || 0, 'IQD', currentCurrency),
      `${(investor.sharePercentage || 0).toFixed(2)}%`,
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
    
    const currentCurrency = settings?.defaultCurrency || 'IQD';
    
    const infoHeaders = ['المعلومة', 'القيمة'];
    const infoRows = [
      ['الاسم', data.fullName],
      ['الهاتف', data.phone],
      [`مبلغ المساهمة`, formatCurrency(data.amount || 0, 'IQD', currentCurrency)],
      [`مبلغ التدوير`, formatCurrency(data.rollover_amount || 0, 'IQD', currentCurrency)],
      ['نسبة المساهمة (%)', (data.sharePercentage || 0).toFixed(2)],
      ['تاريخ الانضمام', data.createdAt]
    ];
    
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
      const transRows = data.transactions.map(transaction => [
        formatTransactionType(transaction.type),
        formatCurrency(transaction.amount || 0, transaction.currency || 'IQD', currentCurrency),
        transaction.currency || 'IQD',
        transaction.withdrawSource || 'غير محدد',
        transaction.financialYear ? `${transaction.financialYear.year || 'غير محدد'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : 'غير محدد',
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
        'نسبة المساهمة (%)', 
        `الربح اليومي`, 
        `إجمالي الربح`, 
        'تاريخ التوزيع'
      ];
      
      const distRows = data.profitDistributions.map(distribution => [
        `${distribution.financialYear.year} - ${distribution.financialYear.periodName}`,
        formatCurrency(distribution.amount || 0, 'IQD', currentCurrency),
        distribution.currency || 'IQD',
        (distribution.percentage || 0).toFixed(2),
        formatCurrency(distribution.dailyProfit || 0, 'IQD', currentCurrency),
        formatCurrency(distribution.financialYear.totalRollover || 0, 'IQD', currentCurrency),
        distribution.financialYear.distributedAt
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
    
    const currentCurrency = settings?.defaultCurrency || 'IQD';
    
    const headers = [
      'المستثمر', 
      'النوع', 
      `المبلغ`, 
      'العملة', 
      'مصدر العملية',
      'السنة المالية', 
      'التاريخ'
    ];
    
    const rows = data.map(transaction => [
      transaction.investors?.fullName || 'غير معروف',
      formatTransactionType(transaction.type),
      formatCurrency(transaction.amount || 0, transaction.currency || 'IQD', currentCurrency),
      transaction.currency || 'IQD',
      transaction.withdrawSource || 'غير محدد',
      transaction.financialYear ? `${transaction.financialYear.year || 'غير محدد'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : 'غير محدد',
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
    
    const currentCurrency = settings?.defaultCurrency || 'IQD';
    
    // Financial year information table
    const statusMap = {
      'PENDING': 'قيد التوزيع',
      'DISTRIBUTED': 'موزع'
    };
    
    const infoHeaders = ['المعلومة', 'القيمة'];
    const infoRows = [
      ['السنة', data.year],
      ['الفترة', data.periodName],
      [`مبلغ التوزيع`, formatCurrency(data.totalProfit || 0, 'IQD', currentCurrency)],
      ['الحالة', statusMap[data.status] || data.status],
      ['تاريخ البداية', data.startDate],
      ['تاريخ النهاية', data.endDate]
    ];
    
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
        'المستثمر', 
        `رأس المال`, 
        `الربح`, 
        'تاريخ الانضمام', 
        'تاريخ التوزيع'
      ];
      
      const distRows = data.profitDistributions.map(distribution => [
        distribution.investors?.fullName || 'غير معروف',
        formatCurrency(distribution.amount || 0, 'IQD', currentCurrency),
        formatCurrency(distribution.financialYear?.totalProfit || 0, 'IQD', currentCurrency),
        distribution.investors?.createdAt || 'غير محدد',
        data.distributedAt || 'غير محدد'
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
  const currentCurrency = settings?.defaultCurrency || 'IQD';

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
        createStyledHeader(['الاسم', 'الهاتف', 'مبلغ المساهمة', 'مبلغ التدوير', 'نسبة المساهمة', 'تاريخ الإنشاء']),
        ...data.map(investor => [
          investor.fullName,
          investor.phone,
          formatCurrency(investor.amount || 0, 'IQD', currentCurrency),
          formatCurrency(investor.rollover_amount || 0, 'IQD', currentCurrency),
          `${(investor.sharePercentage || 0).toFixed(2)}%`,
          investor.createdAt
        ])
      ];
      break;
      
    case 'individual':
      filename = `تقرير-المستثمر-${data.fullName.replace(/\s+/g, '-')}.xlsx`;
      worksheetData = [
        createStyledHeader(['معلومات المستثمر']),
        ['الاسم', data.fullName],
        ['الهاتف', data.phone],
        ['مبلغ المساهمة', formatCurrency(data.amount || 0, 'IQD', currentCurrency)],
        ['مبلغ التدوير', formatCurrency(data.rollover_amount || 0, 'IQD', currentCurrency)],
        ['نسبة المساهمة', `${(data.sharePercentage || 0).toFixed(2)}%`],
        ['تاريخ الإنشاء', data.createdAt],
        [],
        createStyledHeader(['المعاملات']),
        createStyledHeader(['النوع', 'المبلغ', 'العملة', 'مصدر العملية', 'السنة المالية', 'التاريخ']),
        ...(data.transactions || []).map(transaction => [
          formatTransactionType(transaction.type),
          formatCurrency(transaction.amount || 0, transaction.currency || 'IQD', currentCurrency),
          transaction.currency || 'IQD',
          transaction.withdrawSource || 'غير محدد',
          transaction.financialYear ? `${transaction.financialYear.year || 'غير محدد'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : 'غير محدد',
          transaction.date
        ]),
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['السنة المالية', 'رأس المال', 'العملة', 'نسبة المساهمة', 'الربح اليومي', 'إجمالي الربح', 'تاريخ التوزيع']),
        ...(data.profitDistributions || []).map(distribution => [
          `${distribution.financialYear.year} - ${distribution.financialYear.periodName}`,
          formatCurrency(distribution.amount || 0, 'IQD', currentCurrency),
          distribution.currency || 'IQD',
          `${(distribution.percentage || 0).toFixed(2)}%`,
          formatCurrency(distribution.dailyProfit || 0, 'IQD', currentCurrency),
          formatCurrency(distribution.financialYear.totalRollover || 0, 'IQD', currentCurrency),
          distribution.financialYear.distributedAt
        ])
      ];
      break;
      
    case 'transactions':
      filename = 'تقرير-المعاملات.xlsx';
      worksheetData = [
        createStyledHeader(['المستثمر', 'النوع', 'المبلغ', 'العملة', 'مصدر العملية', 'السنة المالية', 'التاريخ']),
        ...data.map(transaction => [
          transaction.investors?.fullName || 'غير معروف',
          formatTransactionType(transaction.type),
          formatCurrency(transaction.amount || 0, transaction.currency || 'IQD', currentCurrency),
          transaction.currency || 'IQD',
          transaction.withdrawSource || 'غير محدد',
          transaction.financialYear ? `${transaction.financialYear.year || 'غير محدد'} ${transaction.financialYear.periodName ? `- ${transaction.financialYear.periodName}` : ''}` : 'غير محدد',
          transaction.date
        ])
      ];
      break;
      
    case 'financial-year': {
      filename = `تقرير-السنة-المالية-${data.periodName.replace(/\s+/g, '-')}.xlsx`;
      const statusMap = { 
        'PENDING': 'قيد التوزيع',
        'DISTRIBUTED': 'موزع'
      };
        
      worksheetData = [
        createStyledHeader(['معلومات السنة المالية']),
        ['السنة', data.year],
        ['الفترة', data.periodName],
        ['مبلغ التوزيع', formatCurrency(data.totalProfit || 0, 'IQD', currentCurrency)],
        ['الحالة', statusMap[data.status] || data.status],
        ['تاريخ البداية', data.startDate],
        ['تاريخ النهاية', data.endDate],
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['المستثمر', 'رأس المال', 'الربح', 'تاريخ الانضمام', 'تاريخ التوزيع']),
        ...(data.profitDistributions || []).map(distribution => [
          distribution.investors?.fullName || 'غير معروف',
          formatCurrency(distribution.amount || 0, 'IQD', currentCurrency),
          formatCurrency(distribution.financialYear?.totalProfit || 0, 'IQD', currentCurrency),
          distribution.investors?.createdAt || 'غير محدد',
          data.distributedAt || 'غير محدد'
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