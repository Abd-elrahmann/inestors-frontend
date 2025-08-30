import React from 'react';
import { Modal, Button, Space, Spin, Divider } from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  CloseOutlined
} from '@ant-design/icons';
import IndividualReportContent from './IndividualReportContent';

const IndividualReportModal = ({
  individualReportOpen,
  setIndividualReportOpen,
  selectedInvestor,
  individualReportData,
  individualReportLoading,
  currentCurrency,
  formatAmount,
  handleDownloadPDF,
  handleDownloadExcel,
  handlePrintReport
}) => {
  return (
    <Modal
      title={`تقرير المساهم: ${selectedInvestor?.fullName}`}
      open={individualReportOpen}
      onCancel={() => setIndividualReportOpen(false)}
      width="90%"
      style={{ maxWidth: '1200px' }}
      footer={[
        <Button key="close" onClick={() => setIndividualReportOpen(false)}>
          إغلاق
        </Button>,
        <Space key="actions">
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadPDF('individual')}
          >
            PDF
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleDownloadExcel()}
          >
            Excel
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handlePrintReport('individual')}
          >
            طباعة
          </Button>
        </Space>
      ]}
    >
      {individualReportLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        individualReportData && (
          <IndividualReportContent 
            individualReportData={individualReportData}
            currentCurrency={currentCurrency}
            formatAmount={formatAmount}
          />
        )
      )}
    </Modal>
  );
};

export default IndividualReportModal;