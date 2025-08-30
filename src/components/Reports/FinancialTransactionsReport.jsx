import React from 'react';
import { Table, Tag } from 'antd';

const FinancialTransactionsReport = ({ reportData, currentCurrency, formatAmount }) => {
  const columns = [
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'المساهم',
      dataIndex: 'investor',
      key: 'investor',
    },
    {
      title: 'النوع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'deposit' ? 'green' : 'orange'}>
          {type === 'deposit' ? 'إيداع' : 'سحب'}
        </Tag>
      ),
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatAmount(amount / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), 'IQD'),
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

export default FinancialTransactionsReport;