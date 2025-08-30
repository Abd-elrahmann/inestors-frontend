import React from 'react';
import { Card, Button, Space, Typography, Divider } from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import FinancialTransactionsReport from './FinancialTransactionsReport';
import InvestorsSummaryReport from './InvestorsSummaryReport';
import FinancialYearReport from './FinancialYearReport';

const { Title } = Typography;

const ReportPreview = ({
  selectedReport,
  reportData,
  financialYearReportData,
  currentCurrency,
  formatAmount,
  handleDownloadPDF,
  handleDownloadExcel,
  handlePrintReport
}) => {
  const renderReportContent = () => {
    switch (selectedReport) {
      case "financial_transactions":
        return (
          <FinancialTransactionsReport 
            reportData={reportData} 
            currentCurrency={currentCurrency}
            formatAmount={formatAmount}
          />
        );
      
      case "investors_summary":
        return (
          <InvestorsSummaryReport 
            reportData={reportData} 
            currentCurrency={currentCurrency}
            formatAmount={formatAmount}
          />
        );
      
      case "financial_year":
        return (
          <FinancialYearReport 
            financialYearReportData={financialYearReportData} 
            currentCurrency={currentCurrency}
            formatAmount={formatAmount}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={4}>معاينة التقرير</Title>
        
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleDownloadPDF}
            style={{ borderColor: '#dc3545', color: '#dc3545' }}
          >
            تصدير PDF
          </Button>
          
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleDownloadExcel}
            style={{ borderColor: '#28a745', color: '#28a745' }}
          >
            تصدير Excel
          </Button>
          
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrintReport}
            style={{ borderColor: '#1890ff', color: '#1890ff' }}
          >
            طباعة
          </Button>
        </Space>
      </div>
      
      <Divider />
      
      {renderReportContent()}
    </Card>
  );
};

export default ReportPreview;