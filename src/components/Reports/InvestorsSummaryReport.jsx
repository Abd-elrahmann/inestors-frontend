import React from 'react';
import { Table } from 'antd';

const InvestorsSummaryReport = ({ reportData, currentCurrency, formatAmount }) => {
  const columns = [
    {
      title: 'اسم المساهم',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'الرقم الوطني',
      dataIndex: 'nationalId',
      key: 'nationalId',
    },
    {
      title: 'إجمالي الاستثمار',
      dataIndex: 'totalInvestment',
      key: 'totalInvestment',
      render: (amount) => formatAmount(amount / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), 'IQD'),
    },
    {
      title: 'نسبة المساهمة',
      dataIndex: 'sharePercentage',
      key: 'sharePercentage',
      render: (percentage) => `${percentage}%`,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={reportData?.data || []}
      pagination={{ pageSize: 10 }}
      scroll={{ x: true }}
    />
  );
};

export default InvestorsSummaryReport;