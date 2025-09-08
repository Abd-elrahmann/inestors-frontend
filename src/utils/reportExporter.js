import * as XLSX from 'xlsx';
import { formatCurrency, globalCurrencyManager } from "./globalCurrencyManager";
import Logo from '../assets/images/logo.webp'
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [40, 167, 69];
};

const headerColor = hexToRgb('#28a745');

export const exportAllInvestorsToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();
    doc.addImage(Logo, 'PNG', 10, 10, 50, 50);
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    doc.setFontSize(18);
    doc.text('تقرير جميع المستثمرين', doc.internal.pageSize.width / 2, 20, {
      align: 'center'
    });

    const currentCurrency = globalCurrencyManager.getCurrentDisplayCurrency();
    const headers = [`الاسم`, `البريد الإلكتروني`, `المبلغ (${currentCurrency})`, `تاريخ الإنشاء`];
    const rows = data.map(investor => [
      investor.fullName,
      investor.email,
      formatCurrency(investor.amount, 'IQD'),
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


export const exportIndividualInvestorToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    doc.addImage(Logo, 'PNG', 10, 10, 50, 50);
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    doc.setFontSize(18);
    doc.text('تقرير المستثمر الفردي', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`المستثمر: ${data.fullName}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

    let startY = 40;
    
    const currentCurrency = globalCurrencyManager.getCurrentDisplayCurrency();
    
    const infoHeaders = ['المعلومة', 'القيمة'];
    const infoRows = [
      ['الاسم', data.fullName],
      ['البريد الإلكتروني', data.email],
      [`المبلغ (${currentCurrency})`, formatCurrency(data.amount || 0, 'IQD')],
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
      doc.text('المعاملات', 20, startY);
      startY += 10;
      
      const transHeaders = ['النوع', `المبلغ (${currentCurrency})`, 'العملة', 'التاريخ'];
      const transRows = data.transactions.map(transaction => [
        transaction.type === 'deposit' ? 'إيداع' : 'سحب',
        formatCurrency(transaction.amount || 0, transaction.currency || 'IQD'),
        transaction.currency || 'IQD',
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
      doc.text('توزيعات الأرباح', 20, startY);
      startY += 10;

      const distHeaders = ['السنة المالية', `المبلغ (${currentCurrency})`, 'العملة', 'نسبة المساهمة', 'إجمالي الربح', 'تاريخ التوزيع'];
      const distRows = data.profitDistributions.map(distribution => [
        `${distribution.financialYear.year} - ${distribution.financialYear.periodName}`,
        formatCurrency(distribution.amount || 0, 'IQD'),
        distribution.currency || 'IQD',
        distribution.percentage || 0,
        formatCurrency(distribution.financialYear.totalProfit || 0, 'IQD'),
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

export const exportTransactionsToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();

    doc.addImage(Logo, 'PNG', 10, 10, 50, 50);
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

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

export const exportFinancialYearToPDF = async (data) => {
  try {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDFModule.default();
    
    doc.addImage(Logo, 'PNG', 10, 10, 50, 50);
    doc.addFont('/assets/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.addFont('/assets/fonts/Amiri-Bold.ttf', 'Amiri', 'bold');
    doc.setFont('Amiri');

    doc.setFontSize(18);
    doc.text(`تقرير السنة المالية - ${data.periodName}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    let startY = 30;
    
    const statusMap = {
      'calculated': 'محسوب',
      'distributed': 'موزع'
    };
    
    const infoHeaders = ['المعلومة', 'القيمة'];
    const infoRows = [
      ['السنة', data.year],
      ['الفترة', data.periodName],
      ['إجمالي الربح', formatCurrency(data.totalProfit || 0, 'IQD')],
      ['الحالة', statusMap[data.status] || data.status],
      ['حالة التدوير', `${data.rolloverEnabled ? 'مفعل' : 'معطل'} ${data.rolloverPercentage ? `(${data.rolloverPercentage}%)` : ''}`],
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
    
    if (data.profitDistributions && data.profitDistributions.length > 0) {
      startY = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.text('توزيعات الأرباح', 20, startY);
      startY += 10;
      
      const distHeaders = ['المستثمر', 'المبلغ المستثمر', 'الربح', 'حالة التدوير', 'تاريخ الانضمام', 'تاريخ التوزيع'];
      const distRows = data.profitDistributions.map(distribution => [
        distribution.investors?.fullName || 'غير معروف',
        formatCurrency(distribution.investors?.amount || 0, 'IQD'),
        formatCurrency(distribution.investors?.profit || 0, 'IQD'),
        distribution.isRollover ? 'مفعل' : 'معطل',
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

export const exportToExcel = (data, reportType) => {
  let worksheetData = [];
  let filename = '';
  const currentCurrency = globalCurrencyManager.getCurrentDisplayCurrency();

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
          formatCurrency(investor.amount, 'IQD'),
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
        ['مبلغ المساهمة', formatCurrency(data.amount, 'IQD')],
        ['مبلغ الربح', formatCurrency(data.profit, 'IQD')],
        ['نسبة المساهمة', data.profitDistributions?.[0]?.percentage?.toFixed(2) || 0],
        ['العملة', currentCurrency],
        ['تاريخ الإنشاء', data.createdAt],
        [],
        createStyledHeader(['المعاملات']),
        createStyledHeader(['النوع', 'المبلغ', 'العملة', 'التاريخ']),
        ...(data.transactions || []).map(transaction => [
          transaction.type === 'deposit' ? 'إيداع' : 'سحب',
          formatCurrency(transaction.amount, transaction.currency, 'IQD'),
          transaction.currency,
          transaction.date
        ]),
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['السنة المالية', 'مبلغ المساهمة', 'العملة', 'نسبة المساهمة', 'مبلغ الربح', 'تاريخ التوزيع']),
        ...(data.profitDistributions || []).map(distribution => [
          `${distribution.financialYear.year} - ${distribution.financialYear.periodName}`,
          formatCurrency(distribution.amount || 0, 'IQD'),
          distribution.currency || 'IQD',
          distribution.percentage || 0,
          formatCurrency(distribution.financialYear.totalProfit || 0, 'IQD'),
          distribution.financialYear.distributedAt
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
          formatCurrency(transaction.amount, transaction.currency, 'IQD'),
          transaction.currency,
          transaction.date
        ])
      ];
      break;
    case 'financial-year': {
      filename = `تقرير-السنة-المالية-${data.periodName.replace(/\s+/g, '-')}.xlsx`;
      const statusMap = { 
        'calculated': 'محسوب',
        'distributed': 'موزع'
      };
        
      worksheetData = [
        createStyledHeader(['معلومات السنة المالية']),
        ['السنة', data.year],
        ['الفترة', data.periodName],
        ['إجمالي الربح', formatCurrency(data.totalProfit || 0, 'IQD')],
        ['العملة', currentCurrency],
        ['الحالة', statusMap[data.status] || data.status],
        ['حالة التدوير', data.rolloverEnabled ? 'مفعل' : 'معطل', data.rolloverPercentage ? `(${data.rolloverPercentage}%)` : ''],
        ['تاريخ البداية', data.startDate],
        ['تاريخ النهاية', data.endDate],
        [],
        createStyledHeader(['توزيعات الأرباح']),
        createStyledHeader(['المستثمر', 'المبلغ المستثمر', 'الربح', 'حالة التدوير', 'تاريخ الانضمام', 'تاريخ التوزيع']),
        ...(data.profitDistributions || []).map(distribution => [
          distribution.investors?.fullName || 'غير معروف',
          formatCurrency(distribution.investors?.amount || 0, 'IQD'),
          formatCurrency(distribution.investors?.profit || 0, 'IQD'),
          distribution.isRollover ? 'مفعل' : 'معطل',
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