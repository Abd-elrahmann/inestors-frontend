import * as XLSX from 'xlsx';
import { formatCurrency, globalCurrencyManager } from "./globalCurrencyManager";

// تحويل اللون Hex إلى RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [40, 167, 69]; // Default to #28a745 if invalid
};

const headerColor = hexToRgb('#28a745');

export const exportAllInvestorsToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    // تحميل الخط العربي
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    // عنوان التقرير
    doc.setFontSize(18);
    doc.text('تقرير جميع المستثمرين', doc.internal.pageSize.width / 2, 20, {
      align: 'center'
    });

    const currentCurrency = globalCurrencyManager.getCurrentDisplayCurrency();
    const headers = [`الاسم`, `البريد الإلكتروني`, `المبلغ (${currentCurrency})`, `تاريخ الإنشاء`];
    const rows = data.map(investor => [
      investor.fullName,
      investor.email,
      formatCurrency(investor.amount),
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
        data.cell.styles.halign = 'right'; // ضبط الاتجاه يمين
      }
    });

    doc.save('تقرير-جميع-المستثمرين.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};


export const exportIndividualInvestorToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    // تحميل الخط العربي
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    // عنوان التقرير
    doc.setFontSize(18);
    doc.text('تقرير المستثمر الفردي', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`المستثمر: ${data.fullName}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

    // بداية الجدول
    let startY = 40;
    
    // Investor information table
    const infoHeaders = ['المعلومة', 'القيمة'];
    const infoRows = [
      ['الاسم', data.fullName],
      ['البريد الإلكتروني', data.email],
      ['المبلغ', formatCurrency(data.amount)],
      ['تاريخ الإنشاء', data.createdAt]
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
        direction: 'rtl' // ضبط اتجاه النص لليمين
      },
      bodyStyles: {
        font: 'Amiri'
      },
      styles: {
        halign: 'right',
        font: 'Amiri'
      },
      didParseCell: (data) => {
        data.cell.styles.halign = 'right'; // ضبط الاتجاه يمين
      }
    });
    
    // Transactions table
    if (data.transactions && data.transactions.length > 0) {
      startY = doc.lastAutoTable.finalY + 20; // زيادة المسافة بين الجداول
      
      doc.setFontSize(14);
      doc.text('المعاملات', 20, startY);
      startY += 10;
      
      const transHeaders = ['النوع', 'المبلغ', 'العملة', 'التاريخ'];
      const transRows = data.transactions.map(transaction => [
        transaction.type === 'deposit' ? 'إيداع' : 'سحب',
        formatCurrency(transaction.amount, transaction.currency),
        transaction.currency,
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
          direction: 'rtl' // ضبط اتجاه النص لليمين
        },
        bodyStyles: {
          font: 'Amiri'
        },
        styles: {
          halign: 'right',
          font: 'Amiri'
        },
        didParseCell: (data) => {
          data.cell.styles.halign = 'right'; // ضبط الاتجاه يمين
        }
      });
    }
    
    doc.save(`تقرير-المستثمر-${data.fullName.replace(/\s+/g, '-')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportTransactionsToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    // تحميل الخط العربي
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    // عنوان التقرير
    doc.setFontSize(18);
    doc.text('تقرير المعاملات', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    const headers = ['المستثمر', 'النوع', 'المبلغ', 'العملة', 'التاريخ'];
    const rows = data.map(transaction => [
      transaction.investors.fullName,
      transaction.type === 'deposit' ? 'إيداع' : 'سحب',
      formatCurrency(transaction.amount, transaction.currency),
      transaction.currency,
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
        direction: 'rtl' // ضبط اتجاه النص لليمين
      },
      bodyStyles: {
        font: 'Amiri'
      },
      styles: {
        halign: 'right',
        font: 'Amiri'
      },
      didParseCell: (data) => {
        data.cell.styles.halign = 'right'; // ضبط الاتجاه يمين
        }
    });
    
    doc.save('تقرير-المعاملات.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportFinancialYearToPDF = async (data) => {
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
    
    // Financial year information table
    const statusMap = {
      'calculated': 'محسوب',
      'approved': 'معتمد',
      'distributed': 'موزع'
    };
    
    const infoHeaders = ['المعلومة', 'القيمة'];
    const infoRows = [
      ['السنة', data.year],
      ['الفترة', data.periodName],
      ['إجمالي الربح', formatCurrency(data.totalProfit, data.currency)],
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
        direction: 'rtl' // ضبط اتجاه النص لليمين
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
      doc.text('توزيعات الأرباح', 20, startY);
      startY += 10;
      
      const distHeaders = ['المستثمر', 'المبلغ', 'التاريخ'];
      const distRows = data.profitDistributions.map(distribution => [
        distribution.investorId,
        formatCurrency(distribution.amount),
        distribution.distributionDate
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

export const exportToExcel = (data, reportType) => {
  let worksheetData = [];
  let filename = '';
  const currentCurrency = globalCurrencyManager.getCurrentDisplayCurrency();

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
        createStyledHeader(['الاسم', 'البريد الإلكتروني', 'المبلغ', 'تاريخ الإنشاء']),
        ...data.map(investor => [
          investor.fullName,
          investor.email,
          formatCurrency(investor.amount),
          investor.createdAt
        ])
      ];
      break;
      
    case 'individual':
      filename = `تقرير-المستثمر-${data.fullName.replace(/\s+/g, '-')}.xlsx`;
      worksheetData = [
        createStyledHeader(['معلومات المستثمر']),
        ['الاسم', data.fullName],
        ['البريد الإلكتروني', data.email],
        ['المبلغ', formatCurrency(data.amount)],
        ['العملة', currentCurrency],
        ['تاريخ الإنشاء', data.createdAt],
        [],
        createStyledHeader(['المعاملات']),
        createStyledHeader(['النوع', 'المبلغ', 'العملة', 'التاريخ']),
        ...(data.transactions || []).map(transaction => [
          transaction.type === 'deposit' ? 'إيداع' : 'سحب',
          formatCurrency(transaction.amount, transaction.currency),
          transaction.currency,
          transaction.date
        ])
      ];
      break;
      
    case 'transactions':
      filename = 'تقرير-المعاملات.xlsx';
      worksheetData = [
        createStyledHeader(['المستثمر', 'النوع', 'المبلغ', 'العملة', 'التاريخ']),
        ...data.map(transaction => [
          transaction.investors.fullName,
          transaction.type === 'deposit' ? 'إيداع' : 'سحب',
          formatCurrency(transaction.amount, transaction.currency),
          transaction.currency,
          transaction.date
        ])
      ];
      break;
    case 'financial-year': {
      filename = `تقرير-السنة-المالية-${data.periodName.replace(/\s+/g, '-')}.xlsx`;
      const statusMap = { 
        'calculated': 'محسوب',
        'approved': 'معتمد',
        'distributed': 'موزع'
      };
        
      worksheetData = [
        createStyledHeader(['معلومات السنة المالية']),
        ['السنة', data.year],
        ['الفترة', data.periodName],
        ['إجمالي الربح', formatCurrency(data.totalProfit, data.currency)],
        ['العملة', data.currency],
        ['الحالة', statusMap[data.status] || data.status],
        ['تاريخ البداية', data.startDate],
        ['تاريخ النهاية', data.endDate],
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['المستثمر', 'المبلغ', 'التاريخ']),
        ...(data.profitDistributions || []).map(distribution => [
          distribution.investorId,
          formatCurrency(distribution.amount),
          distribution.distributionDate
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